"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

type NavItemBase = {
  title: string
}

type NavItemLink = {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  items?: {
    title: string
    url: string
    icon?: LucideIcon
    status?: string
  }[]
  type?: never
}

type NavItemLabel = {
  type: 'label'
  title: string
  url?: never
  icon?: never
  isActive?: never
  items?: never
}

type NavItem = NavItemLink | NavItemLabel

export function NavMain({
  items,
}: {
  items: NavItem[]
}) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item, index) => {
          if ('type' in item && item.type === 'label') {
            return (
              <div
                key={`${item.title}-${index}`}
                className="px-2 pt-4 pb-2 text-xs font-medium text-muted-foreground transition-opacity group-data-[collapsible=icon]:h-0 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:opacity-0"
              >
                {item.title}
              </div>
            )
          }

          return (
            <SidebarMenuItem key={`${item.title}-${index}`}>
              {item.items ? (
                <Collapsible
                  defaultOpen={item.isActive}
                  className="group/collapsible w-full"
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                      {item.icon && <item.icon className="h-5 w-5 shrink-0 group-data-[collapsible=icon]:mx-auto" />}
                      <span className="truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
                      <ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          {subItem.status === "separator" ? (
                            <div className="mx-2 my-1 border-t border-gray-200 dark:border-gray-700"></div>
                          ) : (
                            <SidebarMenuSubButton asChild>
                              <a href={subItem.url}>
                                {subItem.icon && <subItem.icon className="h-5 w-5 shrink-0 group-data-[collapsible=icon]:mx-auto" />}
                                <span className="truncate group-data-[collapsible=icon]:hidden">{subItem.title}</span>
                              </a>
                            </SidebarMenuSubButton>
                          )}
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <SidebarMenuButton
                  asChild
                  isActive={item.isActive}
                  tooltip={item.title}
                >
                  <a href={item.url}>
                    {item.icon && <item.icon className="h-5 w-5 shrink-0 group-data-[collapsible=icon]:mx-auto" />}
                    <span className="truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
                  </a>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
