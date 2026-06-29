export default function AdminPageSkeleton() {
  return (
    <div className="admin-card admin-skeleton" aria-hidden="true" aria-busy="true">
      <div className="ronicas-skeleton admin-skeleton__title" />
      <div className="ronicas-skeleton admin-skeleton__subtitle" />
      <div className="admin-skeleton__toolbar">
        <div className="ronicas-skeleton admin-skeleton__filter" />
        <div className="ronicas-skeleton admin-skeleton__filter" />
        <div className="ronicas-skeleton admin-skeleton__btn" />
      </div>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="admin-skeleton__row">
          <div className="ronicas-skeleton admin-skeleton__cell" />
          <div className="ronicas-skeleton admin-skeleton__cell admin-skeleton__cell--wide" />
          <div className="ronicas-skeleton admin-skeleton__cell" />
        </div>
      ))}
    </div>
  );
}
