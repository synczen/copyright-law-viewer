import { Router, Route, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import LawViewer from "./pages/LawViewer";
import NotFound from "./pages/NotFound";

function App() {
    return (
        <Router hook={useHashLocation}>
            <Switch>
                <Route path="/" component={LawViewer} />
                <Route component={NotFound} />
            </Switch>
        </Router>
    );
}

export default App;
