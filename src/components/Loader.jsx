import { useEffect, useState } from 'react';
import './Loader.css';

export default function Loader() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const onLoad = () => {
      // HTML siap + iframe Rubik loaded + 500ms steady state
      setTimeout(() => setLoaded(true), 500);
    };

    if (document.readyState === 'complete') {
      onLoad();
    } else {
      window.addEventListener('load', onLoad);
      return () => window.removeEventListener('load', onLoad);
    }
  }, []);

  return (
    <div className={`loader-root ${loaded ? 'loaded' : ''}`}>
      <iframe
        className="loader-iframe"
        src="/models/loadingawal-masukweb.html"
        title="Loading animation"
      />
    </div>
  );
}
