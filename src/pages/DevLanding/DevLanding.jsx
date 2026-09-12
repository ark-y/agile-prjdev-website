function DevLanding() {

    return (
        <main className="dev-page">

            {/* top bar */}
            <header className="dashboard-header">

                <h1>X'S DASHBOARD</h1>

                {/* icons on the right */}
                <section className="dashboard-icons">

                    <button className="icon-button">
                        📥
                    </button>

                    <button className="icon-button">
                        ⚙
                    </button>

                </section>

            </header>


            {/* where all the projects will go */}
            <section className="projects-section">

                {/* button for making a new project */}
                <button className="add-project">
                    +
                </button>

            </section>

        </main>
    );
}

export default DevLanding;