import { Link } from "react-router-dom";
import { Empty, ErrorBox, Loading } from "../../components/ui";
import { LibraryArtwork } from "./components/LibraryArtwork";
import { LibraryHeader } from "./components/LibraryHeader";
import { LibraryImport } from "./components/LibraryImport";
import { LibraryListing } from "./components/LibraryListing";
import { useChartLibrary } from "./hooks/useChartLibrary";

export function ChartLibraryPage() {
  const page = useChartLibrary();
  if (!page.instance.isOwner) return <Empty title="请登录主办账号"><Link to="/auth?returnTo=/manage/library">登录</Link></Empty>;
  return <div className="space-y-5"><LibraryHeader page={page} />{page.library.isLoading ? <Loading /> : page.library.error ? <ErrorBox error={page.library.error} /> : <LibraryListing page={page} />}{page.error!=null && !page.importing && <ErrorBox error={page.error} />}{page.presets.error && <ErrorBox error={page.presets.error} />}{page.importing && <LibraryImport page={page} />}{page.artwork.mode && <LibraryArtwork page={page} />}</div>;
}
