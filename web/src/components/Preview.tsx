import type { FlowConfigStep } from "../types";

export function Preview({ step }: { step: FlowConfigStep }) {
  const response = step.response;

  if (response.$expr) {
    return (
      <div className="preview">
        <div className="bubble expr">
          <div className="bubble-label">$expr</div>
          <code>{response.$expr}</code>
        </div>
        <p className="muted small">
          Backend mengevaluasi ekspresi ini per pesan lalu memakai hasilnya sebagai
          payload. Isi `text`/`photo` di bawah tidak dipakai.
        </p>
      </div>
    );
  }

  const inline = response.reply_markup?.inline_keyboard;
  const reply = response.reply_markup?.keyboard;

  return (
    <div className="preview">
      <div className="bubble">
        {response.photo ? (
          response.photo.startsWith("http") ? (
            <img src={response.photo} alt="" className="bubble-photo" />
          ) : (
            <div className="bubble-photo placeholder">photo: {response.photo}</div>
          )
        ) : null}

        {response.photo
          ? response.caption && <p>{response.caption}</p>
          : response.text && <p>{response.text}</p>}

        {!response.photo && !response.text && (
          <p className="muted">(kosong — backend akan menolak payload)</p>
        )}

        <div className="bubble-time">{response.photo ? "sendPhoto" : "sendMessage"}</div>
      </div>

      {inline && inline.length > 0 && (
        <div className="fake-inline">
          {inline.map((row, rowIndex) => (
            <div className="fake-inline-row" key={rowIndex}>
              {row.map((button, buttonIndex) => (
                <span className="fake-button" key={buttonIndex}>
                  {button.text || "…"}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}

      {reply && reply.length > 0 && (
        <div className="fake-reply">
          {reply.map((row, rowIndex) => (
            <div className="fake-inline-row" key={rowIndex}>
              {row.map((button, buttonIndex) => (
                <span className="fake-reply-button" key={buttonIndex}>
                  {button.text || "…"}
                  {button.request_location ? " ◉" : ""}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
