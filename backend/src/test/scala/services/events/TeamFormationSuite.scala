package services.events
import services.events.objects.*
import services.events.objects.apiTypes.*
import services.events.utils.TeamFormationSupport
import services.identity.objects.User

class TeamFormationSuite extends munit.FunSuite:
  private def team(i: Int): TeamView = TeamView(s"t$i",s"队伍$i",s"c$i",None,None,false,List(User(s"c$i",s"captain$i",s"队长$i")))
  private def fill(draft: TeamDraftView, teams: List[TeamView], maximum: Int, left: Int): List[TeamView] =
    if left==0 then teams
    else
      val chosen=TeamFormationSupport.turn(draft,teams,maximum).getOrElse(fail("尚有空位时必须有轮选席位"))
      val index=TeamFormationSupport.turnIndex(draft,teams,maximum).get
      val updated=teams.map(t=>if t.id==chosen then t.copy(members=t.members :+ User(s"p$left",s"player$left",s"选手$left")) else t)
      fill(draft.copy(pickIndex=index+1),updated,maximum,left-1)

  test("snake and sequential turns balance every partial roster and skip full teams") {
    List[TeamDraftOrder]("snake","round-robin").foreach { order =>
      (2 to 8).foreach { n =>
        val teams=(0 until n).map(team).toList
        val draft=TeamDraftView("drafting",teams.map(_.id),order,0,1,Nil)
        (0 to n*4).foreach { count =>
          val rosters=fill(draft,teams,5,count).map(_.members.size)
          assert(rosters.max-rosters.min<=1)
          assert(rosters.max<=5)
        }
        val full=fill(draft,teams,5,n*4)
        assertEquals(TeamFormationSupport.turn(draft,full,5),None)
        assertEquals(TeamFormationSupport.turn(draft.copy(status="completed"),teams,5),None)
      }
    }
  }
  test("old team policy JSON keeps free captain and free team behavior") {
    val old="""{"min":2,"max":4,"perChart":1,"maxAppearances":3,"aggregation":"sum"}"""
    val policy=io.circe.parser.decode[TeamPolicy](old).toOption.get
    assertEquals(TeamFormationSupport.captainMode(policy),"free")
    assertEquals(TeamFormationSupport.formation(policy),"free")
  }
