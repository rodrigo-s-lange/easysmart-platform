import { useNavigate } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/lib/api'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    } finally {
      logout()
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">ES</span>
            </div>
            <h1 className="text-xl font-bold">EasySmart IoT</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{user?.email}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-muted-foreground">
            Bem-vindo à plataforma EasySmart IoT
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Devices</CardTitle>
              <CardDescription>Dispositivos conectados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">0</div>
              <p className="text-sm text-muted-foreground mt-2">
                Nenhum device conectado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Telemetria</CardTitle>
              <CardDescription>Pontos de dados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">0</div>
              <p className="text-sm text-muted-foreground mt-2">
                Aguardando dados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>Sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-lg font-semibold">Online</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Todos os serviços operacionais
              </p>
            </CardContent>
          </Card>
        </div>

        {/* <Card className="mt-8">
          <CardHeader>
            <CardTitle>Próximos Passos</CardTitle>
            <CardDescription>
              Configure seu primeiro dispositivo IoT
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold">Provisionar Device</h4>
                  <p className="text-sm text-muted-foreground">
                    Crie um novo dispositivo e obtenha o token de acesso
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold">Configurar ESPHome</h4>
                  <p className="text-sm text-muted-foreground">
                    Flash o firmware ESPHome no seu ESP32
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold">Visualizar Telemetria</h4>
                  <p className="text-sm text-muted-foreground">
                    Acompanhe os dados em tempo real no dashboard
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card> */}
      </main>
    </div>
  )
}
