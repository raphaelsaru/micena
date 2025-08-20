import { TeamId, TEAM_LABELS, TEAM_COLORS } from '@/types/database'
import { Button } from '@/components/ui/button'

interface TeamSelectorProps {
  currentTeam: TeamId
  onTeamChange: (teamId: TeamId) => void
}

export function TeamSelector({ currentTeam, onTeamChange }: TeamSelectorProps) {
  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-medium text-gray-700">Selecionar Equipe</label>
      <div className="flex space-x-2">
        {([1, 2, 3, 4] as TeamId[]).map((teamId) => (
          <Button
            key={teamId}
            variant={currentTeam === teamId ? "default" : "outline"}
            size="sm"
            onClick={() => onTeamChange(teamId)}
            className={`min-w-[60px] ${
              currentTeam === teamId 
                ? TEAM_COLORS[teamId] 
                : 'hover:bg-gray-50'
            }`}
          >
            {teamId}
          </Button>
        ))}
      </div>
      <div className="text-xs text-gray-500">
        Equipe atual: {TEAM_LABELS[currentTeam]}
      </div>
    </div>
  )
}
