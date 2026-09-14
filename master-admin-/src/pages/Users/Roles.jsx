import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import RolePermissionTable from '../../components/Users/RolePermissionTable'
import Modal from '../../components/common/Modal'
import DeleteModal from '../../components/common/DeleteModal'
import { RoleForm } from '../../components/Users/StaffAndRoles'
import { roles } from '../../data/dummyData'

export default function Roles() {
  const [rolesData, setRolesData] = useState(roles)
  const [showAddRole, setShowAddRole] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [deletingRole, setDeletingRole] = useState(null)

  const handleAddRole = (role) => {
    setRolesData(prev => {
      const nextNumber = prev.length + 1
      const newRole = {
        ...role,
        id: `ROLE${String(nextNumber).padStart(3, '0')}`,
        userCount: 0,
      }
      return [newRole, ...prev]
    })
    setShowAddRole(false)
  }

  const handleEditRole = (updatedRole) => {
    setRolesData(prev =>
      prev.map(role =>
        role.id === editingRole.id
          ? { ...role, ...updatedRole }
          : role
      )
    )
    setEditingRole(null)
  }

  const handleDeleteRole = () => {
    setRolesData(prev => prev.filter(role => role.id !== deletingRole.id))
    setDeletingRole(null)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddRole(true)}
          className="flex items-center gap-2 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-90"
          style={{ background: 'var(--primary)' }}
        >
          <Plus size={13} /> Add Role
        </button>
      </div>

      <RolePermissionTable
        roles={rolesData}
        onEdit={(role) => setEditingRole(role)}
        onDelete={(role) => setDeletingRole(role)}
      />

      <Modal isOpen={showAddRole} onClose={() => setShowAddRole(false)} title="Create New Role">
        <RoleForm onSubmit={handleAddRole} />
      </Modal>

      <Modal isOpen={!!editingRole} onClose={() => setEditingRole(null)} title="Edit Role">
        {editingRole && (
          <RoleForm initialData={editingRole} onSubmit={handleEditRole} />
        )}
      </Modal>

      <DeleteModal
        isOpen={!!deletingRole}
        onClose={() => setDeletingRole(null)}
        onConfirm={handleDeleteRole}
        title="Delete Role"
        message="Are you sure you want to delete this role?"
        itemName={deletingRole?.name || ''}
      />
    </motion.div>
  )
}
