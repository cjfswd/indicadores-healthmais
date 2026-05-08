import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { useAtom } from 'jotai'
import { createFormAtom } from '@/lib/zod-jotai'
import { dbExecute } from '@/lib/proxy-client'
import { BaseEntitySchema } from '@/lib/domain-schemas'
import { InputField } from '@/components/ui/form-fields'
import { Button } from '@/components/ui/button'

const UserSchema = BaseEntitySchema.extend({
  name: z.string().min(3, "Mínimo 3 letras").default(""),
  email: z.string().email("Email inválido").default(""),
})

const userFormAtom = createFormAtom(UserSchema)

export function AvatarLoader({ userId, name, hasAvatar, onDownload }: { userId: string, name: string, hasAvatar: boolean, onDownload?: (url: string) => void }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (hasAvatar) {
      dbExecute({ action: 'getFile', collection: 'users', id: userId, fieldName: 'avatar' })
        .then(res => {
          if (res.result) {
            const objectUrl = URL.createObjectURL(res.result as any);
            setUrl(objectUrl);
            if (onDownload) onDownload(objectUrl);
          }
        }).catch(console.error)
    }
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [hasAvatar, userId])

  if (hasAvatar && url) {
    return (
      <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-xs overflow-hidden shrink-0">
        <img src={url} alt="" className="w-full h-full object-cover" />
      </div>
    )
  }

  return (
    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-muted-foreground text-sm font-medium shrink-0">
      {name.substring(0, 2).toUpperCase()}
    </div>
  )
}

export function UsersView() {
  const queryClient = useQueryClient()
  const [user, setUser] = useAtom(userFormAtom)
  const [file, setFile] = useState<File | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showTrash, setShowTrash] = useState(false)
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({})

  const handleDownloadAvatar = (userId: string, userName: string, fileName?: string) => {
    const url = avatarUrls[userId];
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || `avatar_${userName}.bin`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', showTrash],
    queryFn: async () => {
      const res = await dbExecute({ 
        action: 'find', 
        collection: 'users',
        query: showTrash ? { deletedAt: { $ne: null } } : undefined
      })
      return res.result as any[]
    }
  })

  const mutation = useMutation({
    mutationFn: async (userData: any) => {
      let buffer: ArrayBuffer | undefined;
      if (file) {
        buffer = await file.arrayBuffer();
        userData.avatarName = file.name;
        userData.avatarType = file.type;
      }
      
      if (editingId) {
        return dbExecute({
          action: 'update',
          collection: 'users',
          id: editingId,
          fileField: file ? 'avatar' : undefined,
          data: { $set: userData }
        }, buffer)
      } else {
        return dbExecute({
          action: 'insert',
          collection: 'users',
          fileField: file ? 'avatar' : undefined,
          data: userData
        }, buffer)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      cancelEdit()
    }
  })

  const cancelEdit = () => {
    setUser(UserSchema.parse({})) // Reset form
    setFile(null)
    setEditingId(null)
  }

  const startEdit = (u: any) => {
    setUser({ name: u.name, email: u.email })
    setEditingId(u._id)
    setFile(null)
  }

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return dbExecute({ action: 'delete', collection: 'users', id })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  })

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      return dbExecute({ action: 'update', collection: 'users', id, data: { $set: { deletedAt: null } } })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  })

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto">
      <div className="bg-card border rounded-lg p-6 space-y-4 shadow-sm">
        <h2 className="text-xl font-semibold">{editingId ? 'Editar Usuário' : 'Novo Usuário'}</h2>
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Nome" value={user.name} onChange={(v: any) => setUser({ name: v })} error={user.errors.name} placeholder="Nome do usuário" />
          <InputField label="Email" value={user.email} onChange={(v: any) => setUser({ email: v })} error={user.errors.email} placeholder="email@exemplo.com" />
        </div>

        {/* Avatar upload hidden */}


        <div className="flex gap-2">
          <Button disabled={!user.isValid || mutation.isPending} onClick={() => mutation.mutate(user.data)}>
            {mutation.isPending ? 'Salvando...' : (editingId ? 'Atualizar Usuário' : 'Salvar Usuário')}
          </Button>
          {editingId && (
            <Button variant="outline" onClick={cancelEdit}>
              Cancelar
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {showTrash ? 'Lixeira (Soft Deleted)' : 'Usuários Ativos'}
          </h2>
          <button 
            className="text-sm text-muted-foreground hover:text-foreground underline"
            onClick={() => setShowTrash(!showTrash)}
          >
            {showTrash ? 'Ver Ativos' : 'Ver Lixeira'}
          </button>
        </div>
        {isLoading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : (
          <div className="grid gap-4">
            {users?.map(u => (
              <div key={u._id} className="flex items-center justify-between p-4 bg-card border rounded-lg shadow-sm">
                <div className="flex items-center gap-4">
                  <AvatarLoader 
                    userId={u._id} 
                    name={u.name} 
                    hasAvatar={!!u.avatar} 
                    onDownload={(url) => setAvatarUrls(prev => ({ ...prev, [u._id]: url }))}
                  />
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                    {showTrash && <p className="text-xs text-destructive mt-1">Excluído em: {new Date(u.deletedAt).toLocaleString()}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {u.avatar && (
                    <button 
                      onClick={() => handleDownloadAvatar(u._id, u.name, u.avatarName)}
                      className="text-sm text-blue-500 hover:underline px-3 py-1"
                    >
                      Download Avatar
                    </button>
                  )}
                  {showTrash ? (
                    <button 
                      onClick={() => restoreMutation.mutate(u._id)}
                      className="text-sm text-green-500 hover:underline px-3 py-1"
                    >
                      Restaurar
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => startEdit(u)}
                        className="text-sm text-foreground hover:underline px-3 py-1"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => deleteMutation.mutate(u._id)}
                        className="text-sm text-destructive hover:underline px-3 py-1"
                      >
                        Excluir
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {users?.length === 0 && (
              <p className="text-muted-foreground text-sm text-center p-8 border rounded-lg border-dashed">
                {showTrash ? 'Lixeira vazia.' : 'Nenhum usuário encontrado.'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
