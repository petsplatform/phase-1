import { HeadphonesIcon, Clock, Wrench, CheckCircle } from 'lucide-react'
import { supportTickets } from '../../data/dummyData'

export default function SupportSummary() {
  const total = supportTickets.length
  const open = supportTickets.filter(t => t.status === 'open').length
  const inProgress = supportTickets.filter(t => t.status === 'in_progress').length
  const resolved = supportTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length

  const summary = [
    { 
      label: 'Total Tickets', 
      value: total, 
      color: '#4230ac', 
      icon: HeadphonesIcon,
      trend: '+2',
      description: 'New this week'
    },
    { 
      label: 'Open', 
      value: open, 
      color: '#dc2626', 
      icon: Clock,
      trend: '-1',
      description: 'Awaiting response'
    },
    { 
      label: 'In Progress', 
      value: inProgress, 
      color: '#ca8a04', 
      icon: Wrench,
      trend: '+3',
      description: 'Under investigation'
    },
    { 
      label: 'Resolved', 
      value: resolved, 
      color: '#16a34a', 
      icon: CheckCircle,
      trend: '+12%',
      description: 'Solved this month'
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {summary.map((t, i) => (
        <div 
          key={i} 
          className="bg-white rounded-4xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start mb-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110" 
              style={{ background: `${t.color}10` }}
            >
              <t.icon size={24} style={{ color: t.color }} />
            </div>
            <div className={`px-2 py-1 rounded-lg text-[10px] font-bold ${t.trend.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {t.trend}
            </div>
          </div>
          
          <div>
            <h3 className="text-3xl font-display font-bold text-gray-900 mb-1">{t.value}</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t.label}</p>
            <p className="text-[10px] text-gray-500 font-medium">{t.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
