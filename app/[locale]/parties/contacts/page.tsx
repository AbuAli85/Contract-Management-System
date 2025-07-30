"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Building2, Search, Filter, Phone, Mail, MapPin } from "lucide-react"

export default function PartiesContactsPage() {
  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Party Contacts</h1>
          <p className="text-muted-foreground">
            Manage and view contact information for all parties
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Parties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">+8 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contacts</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">91% response rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+3 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">Different cities</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contact Directory</CardTitle>
              <CardDescription>All party contacts with their information</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input placeholder="Search contacts..." className="w-64 pl-10" />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 font-bold text-white">
                    {String.fromCharCode(65 + (i % 26))}
                  </div>
                  <div>
                    <h3 className="font-semibold">Company {i}</h3>
                    <p className="text-sm text-muted-foreground">
                      contact{i}@company{i}.com
                    </p>
                    <div className="mt-1 flex items-center gap-4">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        +1-555-{1000 + i}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        City {i}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {i % 3 === 0 ? "Client" : i % 3 === 1 ? "Employer" : "Partner"}
                  </Badge>
                  <Button variant="outline" size="sm">
                    Contact
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Categories</CardTitle>
            <CardDescription>Distribution of contacts by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
                <span className="font-medium">Clients</span>
                <Badge className="bg-blue-100 text-blue-800">67 contacts</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
                <span className="font-medium">Employers</span>
                <Badge className="bg-green-100 text-green-800">45 contacts</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-purple-50 p-3">
                <span className="font-medium">Partners</span>
                <Badge className="bg-purple-100 text-purple-800">34 contacts</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-orange-50 p-3">
                <span className="font-medium">Vendors</span>
                <Badge className="bg-orange-100 text-orange-800">10 contacts</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest contact interactions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Contact updated</p>
                    <p className="text-xs text-muted-foreground">
                      Company {i} - {i} hour{i !== 1 ? "s" : ""} ago
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
