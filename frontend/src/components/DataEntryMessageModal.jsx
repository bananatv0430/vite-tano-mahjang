export default function DataEntryMessageModal({
  isOpen,
  title = "完了",
  message,
  ariaLabel,
  onClose,
  buttons = [],
  popupClassName = "",
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="c-modal2" tabIndex="0">
      <div className="c-modal2__overlay js-close" onClick={onClose} />
      <div
        className={`c-modal2__contents dataEntry__popupContents${popupClassName ? ` ${popupClassName}` : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dataEntry__completeModal">
          <h2 className="dataEntry__completeTitle">{title}</h2>
          <p className="dataEntry__completeText">{message}</p>
          <div className="dataEntry__completeActions">
            {buttons.map((button, index) => (
              <button
                key={`${button.label}-${index}`}
                className={button.className || "c-button -primary -medium dataEntry__completeButton"}
                type="button"
                onClick={button.onClick}
              >
                {button.label}
              </button>
            ))}
          </div>
        </div>
        <button className="c-modal2__close js-close" type="button" onClick={onClose}>
          <span className="c-modal2__close-inner" />
        </button>
      </div>
    </div>
  );
}
