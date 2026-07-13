import http from 'k6/http';
import { Trend, Counter } from 'k6/metrics';
import { check } from 'k6';

const totalDuration = new Trend('total_duration_ms', true);
const tokensPerSecond = new Trend('tokens_per_second');

const BASE_URL = __ENV.RAG_APP_URL || 'http://localhost:8080';

export const options = {
  scenarios: {
    rag_chat: {
      executor: 'ramping-vus',
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 10 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<6000'],
    total_duration_ms: ['p(95)<6000'],
  },
};

export default function () {
  const startTime = Date.now();

  const res = http.post(
    `${BASE_URL}/chat/complete`,
    JSON.stringify({ query: 'How do I run JMeter in non-GUI mode?' }),
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: '30s',
    },
  );

  const duration = Date.now() - startTime;

  check(res, {
    'status 200': (r) => r.status === 200,
    'has answer': (r) => JSON.parse(r.body).answer !== undefined,
  });

  totalDuration.add(duration);

  // Rough tokens/sec estimate from word count
  const words = JSON.parse(res.body).answer.trim().split(/\s+/).length;
  tokensPerSecond.add((words / duration) * 1000);
}
