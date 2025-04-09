import "./Loader.css";

const Loader = () => {
    return (
        <div id="loading" className="loading">
            <div style= {{ position: "relative", left:"50%", top:"50%", transform: "translate(-50%, 50%)", backgroundColor: "lightgrey"}}>
                <div className="loading-container">
                    <div className="ball"></div>
                    <div className="ball"></div>
                    <div className="ball"></div>
                    <div className="ball"></div>
                </div>
            </div>
        </div>
    )
};
export default Loader;