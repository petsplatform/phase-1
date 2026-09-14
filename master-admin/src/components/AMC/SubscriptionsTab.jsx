import Card from '../common/Card'
import Table from '../common/Table'
import StatusBadge from '../common/StatusBadge'
import { amcSubscriptions } from '../../data/dummyData'

export default function SubscriptionsTab() {
  const columns = [
    { key: 'customer', label: 'Customer' },
    { key: 'plan', label: 'Plan' },
    { key: 'startDate', label: 'Start' },
    { key: 'expiryDate', label: 'Expiry' },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> }
  ]

  return (
    <Card>
      <Table columns={columns} data={amcSubscriptions} />
    </Card>
  )
}
