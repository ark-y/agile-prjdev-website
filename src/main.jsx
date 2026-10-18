import { createRoot } from "react-dom/client";
import App from "./App";
import TextSizeControl from "./components/TextSizeControl/TextSizeControl";

const rootElement = document.getElementById("root");

if (!rootElement) {
    throw new Error('Could not find the app root element with id "root".');
}

createRoot(rootElement).render(
    <>
        <App />
        <TextSizeControl />
    </>
);