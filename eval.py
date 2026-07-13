from deepeval.metrics import FaithfulnessMetric, AnswerRelevancyMetric
from deepeval.test_case import LLMTestCase
from deepeval.models import GeminiModel

judge_model = GeminiModel(
    model="gemini-3.5-flash",
    api_key=os.getenv("GEMINI_API_KEY"),
)

faithfulness_metric = FaithfulnessMetric(threshold=0.75, model=judge_model)
answer_relevancy_metric = AnswerRelevancyMetric(threshold=0.8, model=judge_model)

def test_jmeter_non_gui_mode_answer():
    question = "How do I run JMeter in non-GUI mode?"
    result = query_rag_app(question)

    test_case = LLMTestCase(
        input=question,
        actual_output=result["answer"],
        retrieval_context=result["retrieved_chunks"],
    )

    for metric in [faithfulness_metric, answer_relevancy_metric]:
        metric.measure(test_case)
        status = "PASS" if metric.success else "FAIL"
        print(f"[{status}] {metric.__class__.__name__}: {metric.score:.3f}")

    failed = [m for m in [faithfulness_metric, answer_relevancy_metric] 
              if not m.success]
    if failed:
        names = ", ".join(m.__class__.__name__ for m in failed)
        raise AssertionError(f"Metrics below threshold: {names}")
