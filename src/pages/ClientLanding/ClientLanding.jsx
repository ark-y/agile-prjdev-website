import { useEffect, useRef } from "react";
import "./ClientLanding.css";

function ClientLanding(){
    const donutRef = useRef(null);

    useEffect(() => {
        // Load progressbar.js from CDN once on mount
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/progressbar.js/1.1.0/progressbar.min.js";
        script.async = true;

        script.onload = () => {
        const donut = new window.ProgressBar.Circle(donutRef.current, {
            color: "#6FD361",
            trailColor: "#18273A",
            strokeWidth: 15,
            trailWidth: 15,
            fill: null,
            duration: 1200,
            easing: "easeOut",
            svgStyle: {
            display: "block",
            width: "100%",
            height: "100%",
            },
        });
        donut.animate(0.67); // 67%
        };

        document.body.appendChild(script);

        return () => {
        document.body.removeChild(script);
        };
    }, []);

    return(
        <main className="client-page">
            {/*Header*/}
            <header class="client-dashboard-header">
                <h1>PROJECT 1</h1>
                <span class="percentage" id="header-percentage">67%</span>
            </header>
            {/*Contents of dashboard*/}
            <section class="dashboard-content">

                {/*Progress donut*/}
                <section class="progress-section" aria-label="Overall progress">
                    <figure class="progress-donut-container">
                        <span class="progress-donut" id="progress-donut"></span>
                    </figure>
                </section>

                {/*current tasks panel*/}
                <section class="right-panel">
                    <article class="current-tasks">
                        <h2>Current Tasks</h2>
                        <ul class="current-tasks-list">
                            <li class="task-item">Task 1</li>
                            <li class="task-item">Task 2</li>
                            <li class="task-item">Long task 3</li>
                            <li class="task-item">Tasks all around</li>
                        </ul>
                    </article>

                    {/*Sprint Box*/}
                    <article class="sprint-box">
                        <h3>Sprint 4</h3>
                        <span class="percentage">67%</span>
                    </article>
                </section>
            </section>
        </main>
    );
}

export default ClientLanding;