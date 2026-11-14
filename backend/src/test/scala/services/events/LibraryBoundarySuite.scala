package services.events
import io.circe.parser.decode
import io.circe.syntax.*
import services.events.objects.*
import services.events.utils.{ArtworkValidation, RepositorySupport}

class LibraryBoundarySuite extends munit.FunSuite:
  test("basic library metadata has defaults without accepting pool assignments") {
    val chart=decode[LibraryChart]("""{"game_key":"phigros","title":"Test","difficulty_label":"IN","pool_tag":"main","role":"pick"}""").toOption.get
    assertEquals(chart.song_key,"Test")
    assertEquals(chart.chart_key,"phigros:Test:standard:IN")
    assertEquals(chart.artist,"")
    assertEquals(chart.level_value,None)
    assert(!chart.asJson.hcursor.downField("pool_tag").succeeded)
    assert(!chart.asJson.hcursor.downField("role").succeeded)
  }
  test("numeric source IDs, aliases and decimal strings decode; display plus ratings stay unknown") {
    val chart=decode[LibraryChart]("""{"gameKey":"arcaea","songId":123,"chartKey":"ftr-123","name":"Test","difficulty":"FTR","constant":"10.7"}""").toOption.get
    assertEquals(chart.song_key,"123")
    assertEquals(chart.chart_key,"ftr-123")
    assertEquals(chart.level_value,Some(BigDecimal("10.7")))
    assertEquals(decode[LibraryChart]("""{"title":"Test","level":"13+"}""").toOption.get.level_value,None)
  }
  test("library merge mode is a closed input state") {
    assert(decode[LibraryImportMode]("\"merge\"").isRight)
    assert(decode[LibraryImportMode]("\"erase-all\"").isLeft)
    assert(decode[ChartRole]("\"pick\"").isRight)
    assert(decode[ChartRole]("\"unknown\"").isLeft)
  }
  test("artwork fields remain optional and both library and frozen chart codecs retain them") {
    val source="https://example.test/jackets/a.png"
    val metadata=decode[LibraryChart](s"""{"title":"Art","difficulty":"IN","coverUrl":"$source"}""").toOption.get
    assertEquals(metadata.cover_url,Some(source))
    val chart=Chart("phigros","","a","Art","Artist","a-in","standard","IN",None,"main","pick",1,Some(source))
    assertEquals(decode[Chart](chart.asJson.noSpaces).toOption.get.cover_url,Some(source))
    assertEquals(decode[Chart](chart.asJson.mapObject(_.remove("cover_url")).noSpaces).toOption.get.cover_url,None)
    assertEquals(new RepositorySupport(null).concealed(chart,"test-event").cover_url,None)
  }
  test("artwork sources reject active content and uploads identify supported binary signatures") {
    assert(ArtworkValidation.validSource(Some("https://example.test/a%20b.png")))
    assert(ArtworkValidation.validSource(Some("/api/artwork/"+"a"*64+".png")))
    assert(!ArtworkValidation.validSource(Some("javascript:alert(1)")))
    assert(!ArtworkValidation.validSource(Some("data:image/svg+xml,<svg/>")))
    assert(!ArtworkValidation.validSource(Some("https://user:secret@example.test/a.png")))
    assert(!ArtworkValidation.validSource(Some("/api/artwork/../database-password")))
    assertEquals(ArtworkValidation.format(Vector(137,80,78,71,13,10,26,10).map(_.toByte)),Some(ArtworkFormat.Png))
    assertEquals(ArtworkValidation.format("<html>bad</html>".getBytes.toVector),None)
  }
