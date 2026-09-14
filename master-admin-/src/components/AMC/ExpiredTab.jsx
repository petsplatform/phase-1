import Card from '../common/Card'
import Table from '../common/Table'
import StatusBadge from '../common/StatusBadge'
import { amcSubscriptions } from '../../data/dummyData'

export default function ExpiredTab() {
  const expired = amcSubscriptions.filter(s => s.status === 'expired')
  
  const columns = [
    { key: 'customer', label: 'Customer' },
    { key: 'plan', label: 'Plan' },
    { key: 'expiryDate', label: 'Expiry' },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> }
  ]

  return (
    <Card>
      <Table columns={columns} data={expired} />
    </Card>
  )
}
