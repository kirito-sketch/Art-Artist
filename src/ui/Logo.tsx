import { useState } from 'react';

/** Brand mark from public/images/brand/logo.png; the wordmark stands in until the file is delivered. */
export function Logo() {
  const [failed, setFailed] = useState(false);
  return (
    <span className="logo" aria-label="Ana">
      {failed ? <span className="wordmark">Ana</span> : <img src="images/brand/logo.png" alt="" onError={() => setFailed(true)} />}
    </span>
  );
}
