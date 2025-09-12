
interface DashboardShellProps {
    children: React.ReactNode;
    rightRail?: React.ReactNode;
    stickyRail?: boolean;
}

/**
 * DashboardShell - Main layout component for dashboard pages
 * 
 * Provides a responsive 12-column grid with main content and optional right rail
 * that stacks on smaller screens.
 */
const DashboardShell: React.FC<DashboardShellProps> = ({
    children,
    rightRail,
    stickyRail = false
}) => {
    return (
        <div className="container">
            <div className="grid-12">
                {/* Main Content Area */}
                <main className="col-main">
                    {children}
                </main>

                {/* Right Rail */}
                {rightRail && (
                    <aside className={`col-rail ${stickyRail ? 'sticky-top' : ''}`}>
                        {rightRail}
                    </aside>
                )}
            </div>
        </div>
    );
};

export default DashboardShell;