import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface PageHeaderProps {
  title?: string
  breadcrumbs?: Array<{
    label: string
    href?: string
  }>
}

export function PageHeader({ title, breadcrumbs }: PageHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <BreadcrumbItem key={index}>
                {index < breadcrumbs.length - 1 ? (
                  <>
                    {crumb.href ? (
                      <BreadcrumbLink href={crumb.href}>
                        {crumb.label}
                      </BreadcrumbLink>
                    ) : (
                      <span>{crumb.label}</span>
                    )}
                    <BreadcrumbSeparator className="ml-2" />
                  </>
                ) : (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      ) : title ? (
        <h1 className="text-lg font-semibold">{title}</h1>
      ) : null}
    </header>
  )
}
