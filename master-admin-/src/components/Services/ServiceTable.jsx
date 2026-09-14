import Card from '../common/Card'
import Table from '../common/Table'
import StatusBadge from '../common/StatusBadge'
import { serviceRequests } from '../../data/dummyData'

export default function ServiceTable() {
  const columns = [
    { key: 'id', label: 'Request ID' },
    { key: 'customer', label: 'Customer' },
    { key: 'type', label: 'Type', render: (v) => <StatusBadge status={v} /> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'priority', label: 'Priority', render: (v) => <StatusBadge status={v} /> }
  ]

  return (
    <Card>
      <Table columns={columns} data={serviceRequests} />
    </Card>
  )
}
