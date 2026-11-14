import { QueryClient,QueryClientProvider } from "@tanstack/react-query";
import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter,Link,Route,Routes,Navigate } from "react-router-dom";
import { EventLayout } from "./app/EventLayout";
import { useInstance } from "./app/InstanceContext";
import { Layout } from "./app/Layout";
import { Empty, Loading } from "./components/ui";
import { EventOverviewPage } from "./pages/EventOverviewPage";
import "./styles.css";
const ChartLibraryPage = lazy(() => import("./pages/ChartLibraryPage").then(module => ({ default: module.ChartLibraryPage })));
const PoolSelectionPage = lazy(() => import("./pages/PoolSelectionPage").then(module => ({ default: module.PoolSelectionPage })));
const AuthPage = lazy(() => import("./pages/AuthPage").then(module => ({ default: module.AuthPage })));
const EventEditorPage = lazy(() => import("./pages/EventEditorPage").then(module => ({ default: module.EventEditorPage })));
const MatchRoomPage = lazy(() => import("./pages/MatchRoomPage").then(module => ({ default: module.MatchRoomPage })));
const MyPage = lazy(() => import("./pages/MyPage").then(module => ({ default: module.MyPage })));
const OrganizerConsolePage = lazy(() => import("./pages/OrganizerConsolePage").then(module => ({ default: module.OrganizerConsolePage })));
const ParticipantsPage = lazy(() => import("./pages/ParticipantsPage").then(module => ({ default: module.ParticipantsPage })));
const PoolPage = lazy(() => import("./pages/PoolPage").then(module => ({ default: module.PoolPage })));
const RulesPage = lazy(() => import("./pages/RulesPage").then(module => ({ default: module.RulesPage })));
const SchedulePage = lazy(() => import("./pages/SchedulePage").then(module => ({ default: module.SchedulePage })));
const TeamLobbyPage = lazy(() => import("./pages/TeamLobbyPage").then(module => ({ default: module.TeamLobbyPage })));
const TeamDraftPage = lazy(() => import("./pages/TeamDraftPage").then(module => ({ default: module.TeamDraftPage })));
const EliminationGroupPage = lazy(() => import("./pages/EliminationGroupPage").then(module => ({ default: module.EliminationGroupPage })));
const client = new QueryClient({
  defaultOptions: { queries: { staleTime: 15000, refetchOnWindowFocus: true } },
});
function QualifierRoute(){const state=useInstance();const stage=state.event?.rules.stages.find(s=>s.kind==="ranking");return <Navigate replace to={stage?`/schedule/${stage.id}`:"/schedule"}/>;}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <Suspense fallback={<Loading />}><Routes>
          <Route element={<Layout />}>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/me" element={<MyPage />} />
            <Route path="/manage/library" element={<ChartLibraryPage />} />
            <Route path="/manage/pools" element={<PoolSelectionPage />} />
            <Route path="/manage/config" element={<EventEditorPage />} />
            <Route path="/manage" element={<OrganizerConsolePage />} />
            <Route element={<EventLayout />}>
              <Route path="/" element={<EventOverviewPage />} />
              <Route path="/rules" element={<RulesPage />} />
              <Route path="/participants" element={<ParticipantsPage />} />
              <Route path="/pool" element={<PoolPage />} />
              <Route path="/qualifier" element={<QualifierRoute />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/schedule/:stageId" element={<SchedulePage />} />
              <Route path="/teams" element={<TeamLobbyPage />} />
              <Route path="/team-draft" element={<TeamDraftPage />} />
            </Route>
            <Route path="/matches/:matchId" element={<MatchRoomPage />} />
            <Route path="/matches/:matchId/history" element={<Navigate to=".." relative="path" replace />} />
            <Route path="/elimination-groups/:groupId" element={<EliminationGroupPage />} />
            <Route
              path="*"
              element={
                <Empty title="没有找到这个页面">
                  <Link to="/" className={"button [border:1px_solid_transparent] [border-radius:6px] [display:inline-flex] [align-items:center] [justify-content:center] [gap:9px] [min-height:40px] [padding:11px_17px] [font-size:var(--type-11-19)] [font-weight:500] [white-space:nowrap] [transition:background_0.2s,_border-color_0.2s,_transform_0.2s] [&.primary]:[background:var(--accent)] [&.primary]:[color:var(--palette-102a21)] [&.primary]:[border-color:var(--accent)] [&.primary:hover:not(:disabled)]:[background:var(--palette-baf5df)] [&.primary:hover:not(:disabled)]:[transform:translateY(-1px)] [&.secondary]:[background:var(--palette-1c2228)] [&.secondary]:[border-color:var(--palette-353e46)] [&.secondary]:[color:var(--palette-cdd5da)] [&.secondary:hover:not(:disabled)]:[background:var(--palette-283139)] [&.secondary:hover:not(:disabled)]:[border-color:var(--palette-536660)] [&.ghost]:[background:transparent] [&.ghost]:[color:var(--palette-bcc9c8)] [&.ghost:hover]:[background:var(--palette-202926)] [&.small]:[min-height:31px] [&.small]:[padding:8px_11px] [&.small]:[font-size:var(--type-10-18)] [&.small]:[gap:7px] [@media((max-width:_1250px))]:[.hero-buttons_&]:[font-size:var(--type-10-18)] [@media((max-width:_1250px))]:[.hero-buttons_&]:[padding:10px_12px] [@media((max-width:_1000px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_1000px))]:[.hero-buttons_&]:[gap:6px] [@media((max-width:_760px))]:[.hero-buttons_&]:[font-size:var(--type-9-18)] [@media((max-width:_540px))]:[.hero-buttons_&]:[font-size:var(--type-11-19)] [@media((max-width:_540px))]:[.hero-buttons_&]:[padding:12px_15px] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[font-size:var(--type-10-18)] [@media((max-width:_540px))]:[.bottom-banner_>_&]:[width:100%] [&.full-width]:[white-space:normal] [&.full-width]:[line-height:1.5] [&.full-width]:[text-align:center] [&.full-width]:[height:auto] [&.full-width]:[min-height:44px] primary [.hero-buttons_&]:[min-height:43px] [.hero-buttons_&]:[padding:12px_17px]"}>
                    回到当前赛事
                  </Link>
                </Empty>
              }
            />
          </Route>
        </Routes></Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
