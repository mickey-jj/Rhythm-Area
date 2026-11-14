ThisBuild / scalaVersion := "3.9.0"
ThisBuild / organization := "area"
ThisBuild / version := "0.3.0"
lazy val writeRuntimeClasspath = taskKey[File]("Write the runtime classpath for the local launcher")
lazy val root = project.in(file(".")).settings(
  name := "rhythm-area",
  scalacOptions += "-Xmax-inlines:128",
  writeRuntimeClasspath := {
    val destination = target.value / "runtime-classpath.txt"
    IO.write(destination, (Runtime / fullClasspath).value.files.map(_.getAbsolutePath).mkString(java.io.File.pathSeparator))
    destination
  },
  libraryDependencies ++= Seq(
    "org.http4s" %% "http4s-ember-server" % "0.23.38",
    "org.http4s" %% "http4s-dsl" % "0.23.38",
    "org.http4s" %% "http4s-circe" % "0.23.38",
    "io.circe" %% "circe-generic" % "0.14.15",
    "io.circe" %% "circe-parser" % "0.14.15",
    "org.typelevel" %% "doobie-core" % "1.0.0-RC13",
    "org.typelevel" %% "doobie-hikari" % "1.0.0-RC13",
    "org.typelevel" %% "doobie-postgres" % "1.0.0-RC13",
    "org.slf4j" % "slf4j-simple" % "2.0.17",
    "org.scalameta" %% "munit" % "1.2.1" % Test
  )
)
