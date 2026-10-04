"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { adminApi, type AdminUser } from "@/lib/admin/api"
import { ContentRequestError } from "@/lib/content-request"
import type { UserRole } from "@/lib/auth/types"

const roles: UserRole[] = ["user", "professional", "moderator", "editor", "admin"]

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [error, setError] = useState("")

  const load = () => {
    adminApi.listUsers().then(setUsers).catch((err: unknown) => {
      setError(err instanceof ContentRequestError ? err.message : "Не удалось загрузить пользователей.")
    })
  }

  useEffect(() => {
    load()
  }, [])

  const change = async (user: AdminUser, role: UserRole) => {
    setError("")
    try {
      const updated = await adminApi.setRole(user.id, role)
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)))
    } catch (err) {
      setError(err instanceof ContentRequestError ? err.message : "Не удалось сменить роль.")
    }
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Ник</th>
              <th className="px-4 py-3 font-medium">Роль</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">{user.nickname}</td>
                <td className="px-4 py-3">
                  <label className="sr-only" htmlFor={`role-${user.id}`}>
                    Роль {user.nickname}
                  </label>
                  <select
                    id={`role-${user.id}`}
                    className="rounded-md border border-border bg-background px-2 py-1"
                    value={user.role}
                    onChange={(event) => void change(user, event.target.value as UserRole)}
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button variant="outline" onClick={load}>
        Обновить
      </Button>
    </div>
  )
}
