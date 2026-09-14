import { useState } from 'react'
import { Check } from 'lucide-react'
import { staff } from '../../data/dummyData'

export default function AssignDemoForm({ onSubmit }) {
  const [selectedAgent, setSelectedAgent] = useState('')
  const agents = staff.filter(s => ['sales', 'manager', 'technician'].includes(s.role) || s.department === 'Sales' || s.department === 'Marketing')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedAgent) return
    const agentName = agents.find(a => a.id === selectedAgent)?.name
    onSubmit(agentName)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Select Content Owner</label>
        <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto custom-scrollbar">
          {agents.map(agent => (
            <div 
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                selectedAgent === agent.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                   selectedAgent === agent.id ? 'bg-blue-200 text-blue-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {agent.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                  <p className="text-xs text-gray-500">{agent.role} • {agent.department}</p>
                </div>
              </div>
              {selectedAgent === agent.id && <Check size={16} className="text-blue-600" />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={!selectedAgent}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          Assign Owner
        </button>
      </div>
    </form>
  )
}
