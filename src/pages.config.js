import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AIAssistant from './pages/AIAssistant';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Projects": Projects,
    "ProjectDetails": ProjectDetails,
    "Profile": Profile,
    "Settings": Settings,
    "AIAssistant": AIAssistant,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};