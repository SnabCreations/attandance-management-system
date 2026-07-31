export default function DashboardLoading() {
  return (
    <div className="loader-container">
      <div className="loader">
        <div className="loader_cogs">
          <div className="loader_cogs__top">
            <div className="top_part"></div>
            <div className="top_part"></div>
            <div className="top_part"></div>
            <div className="top_hole"></div>
          </div>
          <div className="loader_cogs__left">
            <div className="left_part"></div>
            <div className="left_part"></div>
            <div className="left_part"></div>
            <div className="left_hole"></div>
          </div>
          <div className="loader_cogs__bottom">
            <div className="bottom_part"></div>
            <div className="bottom_part"></div>
            <div className="bottom_part"></div>
            <div className="bottom_hole"></div>
          </div>
        </div>
      </div>

      <style>{`
        .loader-container {
          height: 100%;
          min-height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
          overflow: hidden;
        }
        
        .loader {
          height: 250px;
          position: relative;
          margin: auto;
          width: 400px;
        }
        
        .loader_cogs {
          z-index: -2;
          width: 100px;
          height: 100px;
          top: -120px !important;
          position: absolute;
          left: 0; right: 0; top: 0; bottom: 0;
          margin: auto;
        }
        
        .loader_cogs__top {
          position: relative;
          width: 100px;
          height: 100px;
          transform-origin: 50px 50px;
          animation: rotate 10s infinite linear;
        }
        
        .loader_cogs__top div:nth-of-type(1) { transform: rotate(30deg); }
        .loader_cogs__top div:nth-of-type(2) { transform: rotate(60deg); }
        .loader_cogs__top div:nth-of-type(3) { transform: rotate(90deg); }
        
        .loader_cogs__top div.top_part {
          width: 100px;
          border-radius: 10px;
          position: absolute;
          height: 100px;
          background: var(--brand-primary);
        }
        
        .loader_cogs__top div.top_hole {
          width: 50px;
          height: 50px;
          border-radius: 100%;
          background: var(--bg-canvas);
          position: absolute;
          left: 0; right: 0; top: 0; bottom: 0;
          margin: auto;
        }
        
        .loader_cogs__left {
          position: relative;
          width: 80px;
          transform: rotate(16deg);
          top: 28px;
          transform-origin: 40px 40px;
          animation: rotate_left 10s .1s infinite reverse linear;
          left: -24px;
          height: 80px;
        }
        
        .loader_cogs__left div:nth-of-type(1) { transform: rotate(30deg); }
        .loader_cogs__left div:nth-of-type(2) { transform: rotate(60deg); }
        .loader_cogs__left div:nth-of-type(3) { transform: rotate(90deg); }
        
        .loader_cogs__left div.left_part {
          width: 80px;
          border-radius: 6px;
          position: absolute;
          height: 80px;
          background: var(--brand-secondary);
        }
        
        .loader_cogs__left div.left_hole {
          width: 40px;
          height: 40px;
          border-radius: 100%;
          background: var(--bg-canvas);
          position: absolute;
          left: 0; right: 0; top: 0; bottom: 0;
          margin: auto;
        }
        
        .loader_cogs__bottom {
          position: relative;
          width: 60px;
          top: -65px;
          transform-origin: 30px 30px;
          animation: rotate_left 10.2s .4s infinite linear;
          transform: rotate(4deg);
          left: 79px;
          height: 60px;
        }
        
        .loader_cogs__bottom div:nth-of-type(1) { transform: rotate(30deg); }
        .loader_cogs__bottom div:nth-of-type(2) { transform: rotate(60deg); }
        .loader_cogs__bottom div:nth-of-type(3) { transform: rotate(90deg); }
        
        .loader_cogs__bottom div.bottom_part {
          width: 60px;
          border-radius: 5px;
          position: absolute;
          height: 60px;
          background: var(--text-muted);
        }
        
        .loader_cogs__bottom div.bottom_hole {
          width: 30px;
          height: 30px;
          border-radius: 100%;
          background: var(--bg-canvas);
          position: absolute;
          left: 0; right: 0; top: 0; bottom: 0;
          margin: auto;
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes rotate_left {
          from { transform: rotate(16deg); }
          to { transform: rotate(376deg); }
        }
        
        @keyframes rotate_right {
          from { transform: rotate(4deg); }
          to { transform: rotate(364deg); }
        }
      `}</style>
    </div>
  )
}
