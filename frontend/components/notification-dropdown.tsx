"use client"

import React, { useState, useRef, useEffect } from "react"
import { Bell, MessageSquare, Package, Info, CheckCheck, Building2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { mockNotifications, type Notification } from "@/lib/mock-data"

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
  }

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "community": return <MessageSquare className="size-4" />
      case "catalog": return <Package className="size-4" />
      case "supplier": return <Building2 className="size-4" />
      case "article": return <FileText className="size-4" />
      case "system": return <Info className="size-4" />
    }
  }

  const getTypeLabel = (type: Notification["type"]) => {
    switch (type) {
      case "community": return "Форум"
      case "catalog": return "Каталог камня"
      case "supplier": return "Поставщики"
      case "article": return "Статьи"
      case "system": return "Система"
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-muted-foreground"
        aria-label="Уведомления"
      >
        <Bell className="size-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 flex size-2 rounded-full bg-red-500 ring-2 ring-background" />
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-xl border border-border bg-card shadow-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h3 className="font-display text-sm font-bold">Уведомления</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <CheckCheck className="size-3" />
                Отметить все как прочитанные
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
                  <Bell className="size-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">У вас пока нет новых уведомлений</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications
                  .sort((a, b) => (a.isRead === b.isRead ? 0 : a.isRead ? 1 : -1))
                  .map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={cn(
                        "group flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors",
                        notification.isRead
                          ? "bg-transparent hover:bg-muted/50"
                          : "bg-[var(--primary-softer)] hover:bg-[var(--primary-soft)]",
                      )}
                    >
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
                          notification.isRead
                            ? "bg-muted text-muted-foreground"
                            : "bg-primary text-primary-foreground",
                        )}
                      >
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-foreground">
                            {notification.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {notification.time}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-muted-foreground/70">
                          <span className="rounded-sm bg-muted px-1">{getTypeLabel(notification.type)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-border p-3 text-center">
              <button className="text-xs font-medium text-primary hover:underline">
                Все уведомления
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}