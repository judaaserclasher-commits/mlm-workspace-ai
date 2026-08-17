import { useWorkspaceStore } from '../../store/workspaceStore'
import CRMModule from '../CRM/CRMModule'
import TasksModule from '../Tasks/TasksModule'
import SimulatorModule from '../Simulator/SimulatorModule'
import ContentModule from '../Content/ContentModule'
import DashboardModule from '../Dashboard/DashboardModule'
import ProfileModule from '../Profile/ProfileModule'
import FinanzasModule from '../Finanzas/FinanzasModule'
import OportunidadesModule from '../Oportunidades/OportunidadesModule'
import CampoModule from '../Campo/CampoModule'

export default function ModulesPanel() {
  const activeModule = useWorkspaceStore(s => s.activeModule)

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
      <div className="flex-1 overflow-hidden p-4">
        <div key={activeModule} className="h-full" style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {activeModule === 'inicio'                                         && <DashboardModule />}
          {activeModule === 'crm'                                            && <CRMModule />}
          {(['finanzas','business','personal'].includes(activeModule))        && <FinanzasModule />}
          {activeModule === 'tasks'                                          && <TasksModule />}
          {activeModule === 'content'                                        && <ContentModule />}
          {activeModule === 'simulator'                                      && <SimulatorModule />}
          {activeModule === 'oportunidades'                                  && <OportunidadesModule />}
          {activeModule === 'campo'                                          && <CampoModule />}
          {(['perfil','knowledge'].includes(activeModule))                   && <ProfileModule />}
        </div>
      </div>
    </div>
  )
}
