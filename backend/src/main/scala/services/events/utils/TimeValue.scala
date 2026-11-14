package services.events.utils

private[events] object TimeValue:
  private val timestamp = """(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})""".r
  private[events] def epoch(value: String): Option[Long] = value match
    case timestamp(y,m,d,h,n,s,z) =>
      val year=y.toInt; val month=m.toInt; val day=d.toInt
      val leap=year%4==0 && (year%100!=0 || year%400==0)
      val days=List(31,if leap then 29 else 28,31,30,31,30,31,31,30,31,30,31)
      val offset=if z=="Z" then 0 else (z.drop(1).take(2).toInt*60+z.takeRight(2).toInt)*(if z.startsWith("-") then -1 else 1)
      Option.when(month>=1 && month<=12 && day>=1 && day<=days(month-1) && h.toInt<24 && n.toInt<60 && s.toInt<60 && math.abs(offset)<=18*60) {
        java.time.LocalDate.of(year,month,day).toEpochDay*86400+h.toLong*3600+n.toLong*60+s.toLong-offset*60
      }
    case _ => None
