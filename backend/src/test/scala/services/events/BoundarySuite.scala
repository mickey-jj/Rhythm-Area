package services.events
import services.events.objects.*
import services.events.objects.given
import services.events.utils.TimeValue
import services.system.routes.ApiName
import services.events.api.*
class BoundarySuite extends munit.FunSuite:
  test("invalid finite states are rejected by the JSON boundary") {
    assert(io.circe.parser.decode[EventStatus]("\"unexpected\"").isLeft)
    assert(io.circe.parser.decode[StageKind]("\"swiss\"").isLeft)
    assert(io.circe.parser.decode[Actor]("\"A\"").exists(_=="A"))
  }
  test("message names use the same canonical convention as frontend API classes") {
    assertEquals(ApiName.of[GetEventsByIdPoolMessage],"get-events-by-id-pool")
    assertEquals(ApiName.of[services.instance.api.InstanceSetupMessage],"instance-setup")
  }
  test("distinct business IDs cannot be passed to the wrong message") {
    val errors=scala.compiletime.testing.typeCheckErrors("""import services.events.objects.*; import services.events.api.*; ReadEventMessage(MatchId("wrong-domain"))""")
    assert(errors.nonEmpty)
  }
  test("pure time parsing validates calendar dates and normalizes offsets") {
    assertEquals(TimeValue.epoch("2026-11-01T08:00:00+08:00"),TimeValue.epoch("2026-11-01T00:00:00Z"))
    assert(TimeValue.epoch("2026-02-30T00:00:00Z").isEmpty)
    assert(TimeValue.epoch("invalid").isEmpty)
  }
