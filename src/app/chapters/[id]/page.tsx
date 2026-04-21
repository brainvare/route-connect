import ChapterDetail from './ChapterDetail';
import chapterIds from './ids.json';

export function generateStaticParams() {
  return chapterIds.map((id: string) => ({ id }));
}

export default function ChapterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <ChapterDetail paramsPromise={params} />;
}
