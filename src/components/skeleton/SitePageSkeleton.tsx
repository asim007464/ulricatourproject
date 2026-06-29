export default function SitePageSkeleton({
  variant = "default",
}: {
  variant?: "default" | "product" | "listing";
}) {
  return (
    <div className="site-skeleton" aria-hidden="true" aria-busy="true">
      <div className="site-skeleton__header">
        <div className="ronicas-skeleton site-skeleton__logo" />
        <div className="site-skeleton__nav">
          <div className="ronicas-skeleton site-skeleton__nav-item" />
          <div className="ronicas-skeleton site-skeleton__nav-item" />
          <div className="ronicas-skeleton site-skeleton__nav-item" />
          <div className="ronicas-skeleton site-skeleton__nav-item" />
        </div>
        <div className="site-skeleton__actions">
          <div className="ronicas-skeleton site-skeleton__btn" />
          <div className="ronicas-skeleton site-skeleton__btn site-skeleton__btn--accent" />
        </div>
      </div>

      <div
        className={`site-skeleton__hero${
          variant === "product" ? " site-skeleton__hero--tall" : ""
        }`}
      />

      <div className="site-skeleton__body">
        <div className="ronicas-skeleton site-skeleton__title" />
        <div className="ronicas-skeleton site-skeleton__line site-skeleton__line--wide" />
        <div className="ronicas-skeleton site-skeleton__line" />
        <div className="ronicas-skeleton site-skeleton__line site-skeleton__line--short" />

        {variant === "listing" || variant === "default" ? (
          <div className="site-skeleton__grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="site-skeleton__card">
                <div className="ronicas-skeleton site-skeleton__card-image" />
                <div className="ronicas-skeleton site-skeleton__card-title" />
                <div className="ronicas-skeleton site-skeleton__card-btn" />
              </div>
            ))}
          </div>
        ) : (
          <div className="site-skeleton__product">
            <div className="ronicas-skeleton site-skeleton__form-block" />
            <div className="ronicas-skeleton site-skeleton__form-block site-skeleton__form-block--short" />
          </div>
        )}
      </div>

      <div className="site-skeleton__footer">
        <div className="ronicas-skeleton site-skeleton__footer-col" />
        <div className="ronicas-skeleton site-skeleton__footer-col" />
        <div className="ronicas-skeleton site-skeleton__footer-col" />
      </div>
    </div>
  );
}
