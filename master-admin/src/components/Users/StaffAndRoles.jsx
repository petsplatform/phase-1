import { useState } from 'react'
import { motion } from 'framer-motion'
import Table from '../common/Table'
import Card from '../common/Card'
import StatusBadge from '../common/StatusBadge'
import DeleteModal from '../common/DeleteModal'
import StatusSelect from '../common/StatusSelect'
import Modal from '../common/Modal'
import { staff as initialStaff, roles as initialRoles } from '../../data/dummyData'
import { UserPlus, Shield, Plus, Edit2, Trash2 } from 'lucide-react'
import StaffForm from './StaffForm'

export function RoleForm({ onSubmit, initialData = null }) {
  const permissions = [
    'dashboard', 'users', 'customers', 'products', 'orders', 'amc',
    'services', 'demo', 'support', 'configurations', 'reports', 'settings', 'system'
  ]
  const subPermissions = ['view', 'add', 'edit', 'delete']

  const buildPermissionActionsFromRole = (role) => {
    if (!role?.permissions?.length) return {}

    return role.permissions.reduce((acc, permissionValue) => {
      const [permission, action] = String(permissionValue).split('.')
      if (!permission) return acc

      if (!acc[permission]) {
        acc[permission] = []
      }

      if (action && subPermissions.includes(action)) {
        if (!acc[permission].includes(action)) {
          acc[permission].push(action)
        }
      } else {
        acc[permission] = [...subPermissions]
      }

      return acc
    }, {})
  }

  const initialPermissionActions = buildPermissionActionsFromRole(initialData)

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    color: initialData?.color || '#4230ac'
  })
  const [permissionActions, setPermissionActions] = useState(initialPermissionActions)
  const [activePermission, setActivePermission] = useState(Object.keys(initialPermissionActions)[0] || null)

  const togglePerm = (permission) => {
    setPermissionActions(prev => {
      if (prev[permission]) {
        const { [permission]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [permission]: [...subPermissions] }
    })

    setActivePermission(prev => (prev === permission ? null : permission))
  }

  const toggleSubPermission = (permission, action) => {
    setPermissionActions(prev => {
      const currentActions = prev[permission] || []
      const nextActions = currentActions.includes(action)
        ? currentActions.filter(a => a !== action)
        : [...currentActions, action]

      return { ...prev, [permission]: nextActions }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const selectedPermissions = Object.keys(permissionActions).filter(
      key => (permissionActions[key] || []).length > 0
    )

    if (selectedPermissions.length === 0) {
      alert('Please select at least one permission and sub-permission.')
      return
    }

    const flatPermissions = selectedPermissions.flatMap(permission =>
      permissionActions[permission].map(action => `${permission}.${action}`)
    )

    onSubmit({
      ...formData,
      permissions: flatPermissions,
      permissionActions,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Role Name</label>
        <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="e.g. Service Manager" />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Permissions</label>
        <div className="flex flex-wrap gap-2">
          {permissions.map(permission => (
            <button 
              key={permission}
              type="button"
              onClick={() => togglePerm(permission)}
              className={`px-3 py-1 text-xs rounded-full border transition-all ${permissionActions[permission] ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
              style={permissionActions[permission] ? { background: 'var(--primary)', borderColor: 'var(--primary)' } : {}}
            >
              {permission}
            </button>
          ))}
        </div>
      </div>

      {Object.keys(permissionActions).length > 0 && (
        <div className="space-y-3 p-3 border rounded-lg" style={{ borderColor: 'var(--border-color)' }}>
          <label className="text-[10px] font-bold text-gray-400 uppercase">Sub Permissions</label>

          <div className="flex flex-wrap gap-2">
            {Object.keys(permissionActions).map(permission => (
              <button
                key={permission}
                type="button"
                onClick={() => setActivePermission(permission)}
                className={`px-3 py-1 text-xs rounded-full border transition-all capitalize ${
                  activePermission === permission
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                {permission}
              </button>
            ))}
          </div>

          {activePermission && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 capitalize">
                {activePermission} actions
              </p>
              <div className="flex flex-wrap gap-2">
                {subPermissions.map(action => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => toggleSubPermission(activePermission, action)}
                    className={`px-3 py-1 text-xs rounded-full border transition-all capitalize ${
                      (permissionActions[activePermission] || []).includes(action)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}
                    style={
                      (permissionActions[activePermission] || []).includes(action)
                        ? { background: 'var(--primary)', borderColor: 'var(--primary)' }
                        : {}
                    }
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="pt-4 flex justify-end">
        <button type="submit" className="px-6 py-2 text-sm font-semibold text-white rounded-xl shadow-md" style={{ background: 'var(--primary)' }}>
          {initialData ? 'Update Role' : 'Create Role'}
        </button>
      </div>
    </form>
  )
}

export default function StaffAndRoles() {
  const [staffData, setStaffData] = useState(initialStaff)
  const [rolesData, setRolesData] = useState(initialRoles)
  const [editingStaff, setEditingStaff] = useState(null)
  const [editingRole, setEditingRole] = useState(null)
  const [isDeletingStaff, setIsDeletingStaff] = useState(null)
  const [showAddStaff, setShowAddStaff] = useState(false)
  const [showAddRole, setShowAddRole] = useState(false)

  const formatPermission = (permission) => {
    const [resource, action] = String(permission).split('.')
    if (!action) return resource
    return `${resource} ${action}`
  }

  const handleAddStaff = (member) => {
    setStaffData([{ ...member, id: `STF${staffData.length + 1}`, joinDate: new Date().toISOString().split('T')[0] }, ...staffData])
    setShowAddStaff(false)
  }

  const handleEditStaff = (updatedData) => {
    setStaffData(prev => prev.map(s => s.id === editingStaff.id ? { ...s, ...updatedData } : s))
    setEditingStaff(null)
  }

  const confirmDeleteStaff = () => {
    if (isDeletingStaff) {
      setStaffData(prev => prev.filter(s => s.id !== isDeletingStaff))
      setIsDeletingStaff(null)
    }
  }

  const handleDeleteStaff = (id) => {
    setIsDeletingStaff(id)
  }

  const handleStatusChange = (id, newStatus) => {
    setStaffData(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s))
  }

  const handleAddRole = (role) => {
    setRolesData([{ ...role, id: `ROLE${rolesData.length + 1}`, members: 0 }, ...rolesData])
    setShowAddRole(false)
  }

  const staffColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'role', label: 'Role', render: v => <span className="font-semibold text-blue-700">{v}</span> },
    { key: 'department', label: 'Department' },
    { key: 'joinDate', label: 'Joined' },
    { 
      key: 'status', 
      label: 'Status', 
      render: (v, row) => (
        <StatusSelect 
          status={v} 
          options={['Active', 'Inactive', 'On Leave']} 
          onChange={(newStatus) => handleStatusChange(row.id, newStatus)} 
        />
      ) 
    },
    {
      key: 'staffActions', label: 'Action', render: (_, row) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setEditingStaff(row)} 
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-amber-600 transition-colors"
            title="Edit Staff"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => handleDeleteStaff(row.id)} 
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors"
            title="Delete Staff"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-8">
      {/* Staff Section */}
      <section className="space-y-4">
        <Table
          title="Staff Directory"
          data={staffData}
          columns={staffColumns}
          searchKey="name"
          actions={
            <button 
              onClick={() => setShowAddStaff(true)}
              className="flex items-center gap-2 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-90"
              style={{ background: 'var(--primary)' }}>
              <UserPlus size={13} /> Add Staff
            </button>
          }
        />
      </section>

      {/* Roles Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-gray-700">Roles & Permissions</h2>
          <button 
            onClick={() => setShowAddRole(true)}
            className="flex items-center gap-2 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-90"
            style={{ background: 'var(--primary)' }}>
            <Plus size={13} /> Create Role
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rolesData.map(role => (
            <Card key={role.id} hover>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${role.color || '#4230ac'}18` }}>
                  <Shield size={18} style={{ color: role.color || '#4230ac' }} />
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: role.color || '#4230ac' }}>
                  {role.members} member{role.members !== 1 ? 's' : ''}
                </span>
              </div>
              <h3 className="font-display font-bold text-gray-800 mb-2">{role.name}</h3>
              <div className="flex flex-wrap gap-1">
                {role.permissions.map(p => (
                  <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium capitalize">{formatPermission(p)}</span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Modal isOpen={showAddStaff} onClose={() => setShowAddStaff(false)} title="Add Staff Member">
        <StaffForm onSubmit={handleAddStaff} />
      </Modal>

      <Modal isOpen={!!editingStaff} onClose={() => setEditingStaff(null)} title="Edit Staff Member">
        {editingStaff && (
          <StaffForm initialData={editingStaff} onSubmit={handleEditStaff} />
        )}
      </Modal>

      <Modal isOpen={showAddRole} onClose={() => setShowAddRole(false)} title="Create New Role">
        <RoleForm onSubmit={handleAddRole} />
      </Modal>
      
      <DeleteModal 
        isOpen={!!isDeletingStaff} 
        onClose={() => setIsDeletingStaff(null)} 
        onConfirm={confirmDeleteStaff}
        title="Delete Staff Member"
        message="Are you sure you want to delete this staff member? This action cannot be undone."
      />
    </div>
  )
}
