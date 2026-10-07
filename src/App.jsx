import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import CreateProjectForm from "./components/CreateProjectForm/CreateProjectForm";
import CreateTaskForm from "./components/CreateTaskForm/CreateTaskForm";
import NotificationCenter from "./components/NotificationCenter/NotificationCenter";
import ProjectSettings from "./components/ProjectSettings/ProjectSettings";
import DevLanding from "./pages/DevLanding/DevLanding";
import ClientLanding from "./pages/ClientLanding/ClientLanding";
import Login from "./pages/Login/Login";
import ProjectOverview from "./pages/ProjectOverview/ProjectOverview";
import {
    addProject,
    deleteProject,
    fetchAllProjects,
    fetchProject,
    renameProject
} from "./services/projectServices";
import {
    addSprint,
    deleteSprint,
    fetchAllSprints,
    modifySprint
} from "./services/sprintService";
import {
    addProjectMember,
    fetchCurrentProfile,
    fetchProjectMemberCandidates,
    removeProjectMember
} from "./services/serviceHelpers";
import {
    addProjectTag,
    addTask,
    deleteTask,
    deleteProjectTag,
    fetchAllTasks,
    fetchProjectMembers,
    fetchProjectTags,
    fetchTaskAssignees,
    fetchTaskStatuses,
    fetchTaskTagIds,
    modifyTask,
    setTaskAssignees,
    setTaskTags,
    updateAssignedTaskStatus
} from "./services/taskServices";
import "./styles/global.css";


function App() {

    const [session, setSession] = useState(null);
    const [isCheckingSession, setIsCheckingSession] = useState(true);

    const [profile, setProfile] = useState(null);

    const [projects, setProjects] = useState([]);
    const [project, setProject] = useState(null);

    const [sprints, setSprints] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [statuses, setStatuses] = useState([]);

    const [projectTags, setProjectTags] = useState([]);
    const [tagsByTask, setTagsByTask] = useState({});

    const [members, setMembers] = useState([]);
    const [memberCandidates, setMemberCandidates] = useState([]);

    const [taskToEdit, setTaskToEdit] = useState(null);

    const [showTaskForm, setShowTaskForm] = useState(false);
    const [showProjectForm, setShowProjectForm] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");


    /*
     * ==============================
     * AUTHENTICATION
     * ==============================
     */

    useEffect(() => {

        let isActive = true;


        supabase.auth
            .getSession()
            .then(({ data, error: sessionError }) => {

                if (!isActive) {
                    return;
                }


                if (sessionError) {
                    throw sessionError;
                }


                setSession(data.session);
                setIsCheckingSession(false);

            })
            .catch((sessionError) => {

                if (isActive) {

                    setError(
                        sessionError.message ||
                        "Could not check the sign-in session."
                    );

                    setIsCheckingSession(false);

                }

            });


        const {
            data: {
                subscription
            }
        } = supabase.auth.onAuthStateChange(
            (_event, nextSession) =>
                setSession(nextSession)
        );


        return () => {

            isActive = false;

            subscription.unsubscribe();

        };

    }, []);


    /*
     * ==============================
     * LOAD PROFILE AND PROJECTS
     * ==============================
     */

    useEffect(() => {

        if (!session) {

            setProfile(null);
            setProjects([]);
            setProject(null);
            setSprints([]);
            setTasks([]);
            setStatuses([]);
            setProjectTags([]);
            setTagsByTask({});

            return;

        }


        let isActive = true;


        setProfile(null);
        setProject(null);

        setShowTaskForm(false);
        setShowProjectForm(false);
        setShowSettings(false);

        setIsLoading(true);
        setError("");


        Promise.allSettled([
            fetchCurrentProfile(),
            fetchAllProjects()
        ])
            .then(
                ([
                    profileResult,
                    projectsResult
                ]) => {

                    if (!isActive) {
                        return;
                    }


                    if (
                        profileResult.status ===
                        "fulfilled"
                    ) {

                        setProfile(
                            profileResult.value
                        );

                    } else {

                        setError(
                            profileResult.reason.message ||
                            "Could not load your account profile."
                        );

                    }


                    if (
                        projectsResult.status ===
                        "fulfilled"
                    ) {

                        setProjects(
                            projectsResult.value
                        );

                    } else {

                        setError(
                            (currentError) =>
                                [
                                    currentError,
                                    projectsResult.reason.message ||
                                    "Could not load projects."
                                ]
                                    .filter(Boolean)
                                    .join(" ")
                        );

                    }

                }
            )
            .finally(() => {

                if (isActive) {
                    setIsLoading(false);
                }

            });


        return () => {

            isActive = false;

        };

    }, [session?.user?.id]);


    /*
     * ==============================
     * LOAD PROJECT
     * ==============================
     */

    const loadProject =
        useCallback(
            async (projectId) => {

                const [
                    loadedProject,
                    loadedSprints,
                    loadedTasks,
                    loadedStatuses,
                    loadedMembers,
                    loadedTags
                ] =
                    await Promise.all([

                        fetchProject(projectId),

                        fetchAllSprints(projectId),

                        fetchAllTasks({
                            projectId
                        }),

                        fetchTaskStatuses(
                            projectId
                        ),

                        /*
                         * Admins AND Developers need
                         * project members because the
                         * task editing page contains
                         * the assignee field.
                         */
                        profile?.role_name === "Admin" ||
                        profile?.role_name === "Developer"
                            ? fetchProjectMembers(
                                projectId
                            )
                            : Promise.resolve([]),

                        fetchProjectTags(
                            projectId
                        )

                    ]);


                const loadedTagsByTask =
                    await fetchTaskTagIds(
                        loadedTasks.map(
                            (task) =>
                                task.task_id
                        )
                    );


                /*
                 * Only admins need the list
                 * of users who could be added
                 * to the project.
                 */
                const loadedCandidates =
                    profile?.role_name === "Admin"
                        ? await fetchProjectMemberCandidates(
                            projectId
                        )
                        : [];


                setProject(
                    loadedProject
                );

                setSprints(
                    loadedSprints
                );

                setTasks(
                    loadedTasks
                );

                setStatuses(
                    loadedStatuses
                );

                setProjectTags(
                    loadedTags
                );

                setTagsByTask(
                    loadedTagsByTask
                );

                setMembers(
                    loadedMembers
                );

                setMemberCandidates(
                    loadedCandidates
                );


                setTaskToEdit(null);
                setShowTaskForm(false);

                setError("");

            },
            [profile?.role_name]
        );


    /*
     * ==============================
     * CLIENT PROJECT
     * ==============================
     */

    useEffect(() => {

        if (
            profile?.role_name !== "Client" ||
            !projects.length ||
            project
        ) {

            return;

        }


        let isActive = true;


        setIsLoading(true);


        loadProject(
            projects[0].project_id
        )
            .catch((loadError) => {

                if (isActive) {

                    setError(
                        loadError.message ||
                        "Could not load your client project."
                    );

                }

            })
            .finally(() => {

                if (isActive) {
                    setIsLoading(false);
                }

            });


        return () => {

            isActive = false;

        };

    }, [
        profile?.role_name,
        projects,
        project,
        loadProject
    ]);


    /*
     * ==============================
     * OPEN PROJECT
     * ==============================
     */

    async function handleOpenProject(
        selectedProject
    ) {

        setIsLoading(true);
        setError("");


        try {

            await loadProject(
                selectedProject.project_id
            );

        } catch (loadError) {

            setError(
                loadError.message ||
                "Could not load this project."
            );

        } finally {

            setIsLoading(false);

        }

    }


    /*
     * ==============================
     * CREATE PROJECT
     * ==============================
     */

    async function handleCreateProject(
        values
    ) {

        const newProject =
            await addProject(values);


        setProjects(
            (currentProjects) => [
                newProject,
                ...currentProjects
            ]
        );


        setShowProjectForm(false);


        await handleOpenProject(
            newProject
        );

    }


    /*
     * ==============================
     * SPRINTS
     * ==============================
     */

    async function handleAddSprint() {

        try {

            const sprint =
                await addSprint({

                    projectId:
                        project.project_id,

                    name:
                        `Sprint ${sprints.length + 1}`

                });


            setSprints(
                (currentSprints) => [
                    ...currentSprints,
                    sprint
                ]
            );

        } catch (createError) {

            setError(
                createError.message ||
                "Could not create the sprint."
            );

        }

    }


    async function handleUpdateSprint(
        sprintId,
        changes
    ) {

        try {

            const updatedSprint =
                await modifySprint(
                    sprintId,
                    changes
                );


            setSprints(
                (currentSprints) =>
                    currentSprints.map(
                        (sprint) =>
                            sprint.sprint_id ===
                            sprintId
                                ? updatedSprint
                                : sprint
                    )
            );

        } catch (updateError) {

            setError(
                updateError.message ||
                "Could not update the sprint."
            );

        }

    }


    async function handleDeleteSprint(
        sprint
    ) {

        if (
            !window.confirm(
                `Delete ${sprint.sprint_name}?`
            )
        ) {

            return;

        }


        try {

            await deleteSprint(
                sprint.sprint_id
            );


            await loadProject(
                project.project_id
            );

        } catch (deleteError) {

            setError(
                deleteError.message ||
                "Could not delete the sprint."
            );

        }

    }


    /*
     * ==============================
     * OPEN / EDIT TASK
     * ==============================
     */

    async function handleEditTask(
        task
    ) {

        setError("");


        try {

            const assigneeIds =
                await fetchTaskAssignees(
                    task.task_id
                );


            setTaskToEdit({

                ...task,

                assigneeIds,

                tagIds:
                    tagsByTask[
                        String(
                            task.task_id
                        )
                    ] || []

            });


            setShowTaskForm(true);

        } catch (loadError) {

            setError(
                loadError.message ||
                "Could not load task assignees."
            );

        }

    }


    /*
     * ==============================
     * SAVE / UPDATE TASK
     * ==============================
     */

    async function handleSaveTask(
        values
    ) {

        const {
            taskId,
            assigneeIds,
            tagIds,
            ...taskChanges
        } = values;


        let savedTask;


        if (taskId) {

            savedTask =
                await modifyTask(
                    taskId,
                    taskChanges
                );


            // Assignment remains Admin-only. Developers can still
            // update status, description, checklist and other task fields.
            if (profile?.role_name === "Admin") {

                await setTaskAssignees(
                    taskId,
                    assigneeIds
                );

            }

        } else {

            if (profile?.role_name !== "Admin") {
                throw new Error(
                    "Only a project admin can create tasks."
                );
            }


            savedTask =
                await addTask({

                    ...taskChanges,

                    projectId:
                        project.project_id,

                    assigneeIds

                });

        }


        // Task tag editing is Admin-only in the database.
        // Developers can still save status, checklist and other task changes
        // without re-saving the existing tags.
        if (profile?.role_name === "Admin") {

            await setTaskTags(
                savedTask.task_id,
                tagIds
            );

        }


        await loadProject(
            project.project_id
        );

    }

    /*
     * ==============================
     * PROJECT TAGS
     * ==============================
     */

    async function handleAddTag(
        name,
        colour
    ) {

        const tag =
            await addProjectTag({

                projectId:
                    project.project_id,

                name,

                ...(colour
                    ? { colour }
                    : {})

            });


        setProjectTags(
            (currentTags) => [
                ...currentTags,
                tag
            ]
        );


        return tag;

    }


    async function handleDeleteTag(
        tagId
    ) {

        try {

            await deleteProjectTag(
                project.project_id,
                tagId
            );


            await loadProject(
                project.project_id
            );

        } catch (deleteError) {

            setError(
                deleteError.message ||
                "Could not delete the tag."
            );

        }

    }


    /*
     * ==============================
     * TASK STATUS
     * ==============================
     */

    async function handleChangeTaskStatus(
        taskId,
        statusId
    ) {

        try {

            await updateAssignedTaskStatus(
                taskId,
                statusId
                    ? Number(statusId)
                    : null
            );


            const refreshedTasks =
                await fetchAllTasks({

                    projectId:
                        project.project_id

                });


            setTasks(
                refreshedTasks
            );

        } catch (updateError) {

            setError(
                updateError.message ||
                "Could not update the task status."
            );

        }

    }


    /*
     * ==============================
     * MOVE TASK TO SPRINT
     * ==============================
     */

    async function handleMoveTaskToSprint(
        taskId,
        sprintId
    ) {

        try {

            const updatedTask =
                await modifyTask(
                    taskId,
                    {
                        sprintId
                    }
                );


            setTasks(
                (currentTasks) =>
                    currentTasks.map(
                        (task) =>
                            task.task_id ===
                            taskId
                                ? {
                                    ...task,
                                    ...updatedTask
                                }
                                : task
                    )
            );

        } catch (updateError) {

            setError(
                updateError.message ||
                "Could not move the task."
            );

        }

    }


    /*
     * ==============================
     * PROJECT MEMBERS
     * ==============================
     */

    async function handleAddMember(
        userId
    ) {

        try {

            await addProjectMember(
                project.project_id,
                userId
            );


            await loadProject(
                project.project_id
            );


            return true;

        } catch (addError) {

            setError(
                addError.message ||
                "Could not add the project member."
            );


            return false;

        }

    }


    async function handleRemoveMember(
        member
    ) {

        const displayName =
            member.user_pref_name ||
            `${member.user_first_name} ${member.user_last_name}`;


        if (
            !window.confirm(
                `Remove ${displayName} from this project and unassign their tasks?`
            )
        ) {

            return;

        }


        try {

            await removeProjectMember(
                project.project_id,
                member.user_id
            );


            await loadProject(
                project.project_id
            );

        } catch (removeError) {

            setError(
                removeError.message ||
                "Could not remove the project member."
            );

        }

    }


    /*
     * ==============================
     * DELETE TASK
     * ==============================
     */

    async function handleDeleteTask(
        task
    ) {

        /*
         * Frontend permission check.
         * Only Admins should be able
         * to delete tasks.
         */
        if (
            profile?.role_name !==
            "Admin"
        ) {

            setError(
                "Only admins can delete tasks."
            );

            return;

        }


        try {

            await deleteTask(
                task.task_id
            );


            setTasks(
                (currentTasks) =>
                    currentTasks.filter(
                        (item) =>
                            item.task_id !==
                            task.task_id
                    )
            );


            /*
             * Close the task form.
             */
            setShowTaskForm(false);
            setTaskToEdit(null);


            /*
             * Refresh project information.
             */
            await loadProject(
                project.project_id
            );

        } catch (deleteError) {

            setError(
                deleteError.message ||
                "Could not delete the task."
            );


            throw deleteError;

        }

    }


    /*
     * ==============================
     * RENAME PROJECT
     * ==============================
     */

    async function handleRenameProject(
        name
    ) {

        if (!name?.trim()) {

            setError(
                "A project name is required."
            );

            return;

        }


        try {

            const updatedProject =
                await renameProject(
                    project.project_id,
                    name
                );


            setProject(
                updatedProject
            );


            setProjects(
                (currentProjects) =>
                    currentProjects.map(
                        (item) =>
                            item.project_id ===
                            updatedProject.project_id
                                ? updatedProject
                                : item
                    )
            );

        } catch (updateError) {

            setError(
                updateError.message ||
                "Could not rename the project."
            );


            throw updateError;

        }

    }


    /*
     * ==============================
     * DELETE PROJECT
     * ==============================
     */

    async function handleDeleteProject(
        projectToDelete
    ) {

        if (
            !window.confirm(
                `Delete "${projectToDelete.project_name}"?`
            )
        ) {

            return;

        }


        try {

            await deleteProject(
                projectToDelete.project_id
            );


            setProjects(
                (currentProjects) =>
                    currentProjects.filter(
                        (item) =>
                            item.project_id !==
                            projectToDelete.project_id
                    )
            );


            if (
                project?.project_id ===
                projectToDelete.project_id
            ) {

                setProject(null);

            }

        } catch (deleteError) {

            setError(
                deleteError.message ||
                "Could not delete the project."
            );

        }

    }


    /*
     * ==============================
     * SIGN OUT
     * ==============================
     */

    async function handleSignOut() {

        try {

            const {
                error: signOutError
            } =
                await supabase.auth.signOut();


            if (signOutError) {

                throw signOutError;

            }


            setProject(null);

            setShowSettings(false);

            setError("");

        } catch (signOutError) {

            setError(
                signOutError.message ||
                "Could not sign out."
            );

        }

    }


    /*
     * ==============================
     * LOADING / LOGIN
     * ==============================
     */

    if (isCheckingSession) {

        return (
            <p role="status">
                Checking sign-in...
            </p>
        );

    }


    if (!session) {

        return (

            <>

                {error && (

                    <p
                        className="app-error"
                        role="alert"
                    >
                        {error}
                    </p>

                )}


                <Login />

            </>

        );

    }


    if (!profile) {

        return (

            <>

                {error && (

                    <p
                        className="app-error"
                        role="alert"
                    >
                        {error}
                    </p>

                )}


                <p role="status">

                    {error
                        ? "Could not load your account profile. Check the error above and confirm your Supabase profile has a valid role."
                        : "Loading your profile."
                    }

                </p>


                {error && (

                    <button
                        type="button"
                        onClick={
                            handleSignOut
                        }
                    >

                        Sign out

                    </button>

                )}

            </>

        );

    }


    /*
     * ==============================
     * APP
     * ==============================
     */

    return (

        <>


            <NotificationCenter />


            {error && (

                <p
                    className="app-error"
                    role="alert"
                >

                    {error}

                </p>

            )}


            {isLoading && (

                <p
                    className="app-loading"
                    role="status"
                >

                    Loading...

                </p>

            )}



            {/* =========================
                CLIENT
            ========================== */}

            {profile.role_name === "Client" ? (

                <ClientLanding

                    project={project}

                    projects={projects}

                    tasks={tasks}

                    sprints={sprints}

                    currentUserId={
                        session.user.id
                    }

                    roleName={
                        profile.role_name
                    }

                    onOpenSettings={() =>
                        setShowSettings(true)
                    }

                    onProjectChange={(
                        selectedProject
                    ) => {

                        if (
                            selectedProject
                        ) {

                            handleOpenProject(
                                selectedProject
                            );

                        }

                    }}

                    onSignOut={
                        handleSignOut
                    }

                />


            ) : project ? (


                /*
                 * =========================
                 * TASK CREATE / EDIT FORM
                 * =========================
                 *
                 * Admin:
                 * - can create
                 * - can edit
                 * - can delete
                 *
                 * Developer:
                 * - can edit existing tasks
                 * - cannot create from here
                 * - cannot delete
                 */

                showTaskForm ? (

                    (
                        profile.role_name === "Admin" ||
                        (
                            profile.role_name === "Developer" &&
                            taskToEdit
                        )
                    ) ? (

                        <CreateTaskForm

                            key={
                                taskToEdit?.task_id ||
                                "new-task"
                            }

                            initialTask={
                                taskToEdit
                            }

                            sprints={
                                sprints
                            }

                            statuses={
                                statuses
                            }

                            projectTags={
                                projectTags
                            }

                            onAddTag={
                                handleAddTag
                            }

                            members={
                                members.filter(
                                    (member) =>
                                        member.role?.role_name ===
                                        "Developer"
                                )
                            }

                            roleName={
                                profile.role_name
                            }

                            currentUser={
                                profile
                            }

                            onDeleteTask={
                                profile.role_name === "Admin"
                                    ? handleDeleteTask
                                    : undefined
                            }

                            onCancel={() => {

                                setShowTaskForm(
                                    false
                                );

                                setTaskToEdit(
                                    null
                                );

                            }}

                            onSaveTask={
                                handleSaveTask
                            }

                        />

                    ) : null


                ) : (


                    /*
                     * =========================
                     * PROJECT OVERVIEW
                     * =========================
                     */

                    <ProjectOverview

                        project={
                            project
                        }

                        tasks={
                            tasks
                        }

                        sprints={
                            sprints
                        }

                        statuses={
                            statuses
                        }

                        projectTags={
                            projectTags
                        }

                        tagsByTask={
                            tagsByTask
                        }

                        roleName={
                            profile.role_name
                        }

                        currentUserId={
                            session.user.id
                        }


                        /*
                         * Only the Admin UI
                         * displays the Add Task
                         * button in ProjectOverview.
                         */
                        onAddTask={() => {

                            setTaskToEdit(
                                null
                            );

                            setShowTaskForm(
                                true
                            );

                        }}


                        /*
                         * Admins and Developers
                         * can click an existing
                         * task.
                         */
                        onEditTask={
                            handleEditTask
                        }


                        onDeleteTask={
                            handleDeleteTask
                        }


                        onAddSprint={
                            handleAddSprint
                        }


                        onUpdateSprint={
                            handleUpdateSprint
                        }


                        onDeleteSprint={
                            handleDeleteSprint
                        }


                        onChangeTaskStatus={
                            handleChangeTaskStatus
                        }


                        onMoveTaskToSprint={
                            handleMoveTaskToSprint
                        }


                        onAddTag={
                            handleAddTag
                        }


                        onDeleteTag={
                            handleDeleteTag
                        }


                        onBack={() =>
                            setProject(null)
                        }


                        onOpenSettings={() =>
                            setShowSettings(
                                true
                            )
                        }

                    />

                )


            ) : (


                /*
                 * =========================
                 * PROJECT LANDING
                 * =========================
                 */

                <>


                    <DevLanding

                        projects={
                            projects
                        }

                        canCreateProject={
                            profile.role_name ===
                            "Admin"
                        }

                        onOpenProject={
                            handleOpenProject
                        }

                        onAddProject={
                            profile.role_name ===
                            "Admin"
                                ? () =>
                                    setShowProjectForm(
                                        true
                                    )
                                : undefined
                        }

                        onDeleteProject={
                            handleDeleteProject
                        }

                        onOpenSettings={() =>
                            setShowSettings(
                                true
                            )
                        }

                        onSignOut={
                            handleSignOut
                        }

                    />


                    {showProjectForm &&
                        profile.role_name ===
                        "Admin" && (

                            <CreateProjectForm

                                onCreate={
                                    handleCreateProject
                                }

                                onCancel={() =>
                                    setShowProjectForm(
                                        false
                                    )
                                }

                            />

                        )}

                </>

            )}



            {/* =========================
                PROJECT SETTINGS
            ========================== */}

            {showSettings && (

                <ProjectSettings

                    project={
                        project
                    }

                    roleName={
                        profile.role_name
                    }

                    members={
                        members
                    }

                    memberCandidates={
                        memberCandidates
                    }

                    onClose={() =>
                        setShowSettings(
                            false
                        )
                    }

                    onAddMember={
                        handleAddMember
                    }

                    onRemoveMember={
                        handleRemoveMember
                    }

                    onRenameProject={
                        handleRenameProject
                    }

                    onMemberCreated={() =>
                        loadProject(
                            project.project_id
                        )
                    }

                />

            )}


        </>

    );

}


export default App;