'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MOCK_PRODUCTS, MOCK_INVENTORY } from '@/lib/mock-data'
import { Plus, Edit2, Trash2, BarChart3 } from 'lucide-react'

export default function ProductsPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)

  const filteredProducts = MOCK_PRODUCTS.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'bg-destructive/30 text-destructive' }
    if (quantity <= 20) return { label: 'Low Stock', color: 'bg-accent/30 text-accent' }
    if (quantity <= 50) return { label: 'Medium Stock', color: 'bg-secondary/30 text-foreground' }
    return { label: 'Well Stocked', color: 'bg-primary/30 text-primary' }
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            {user?.role === 'customer' ? 'Products' : 'Inventory Management'}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {user?.role === 'customer' ? 'Browse all available products' : 'Manage products and inventory'}
          </p>
        </div>
        {user?.role !== 'customer' && (
          <Button
            onClick={() => setIsAddOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-foreground">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">{MOCK_PRODUCTS.length}</div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-foreground">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-accent">
              {MOCK_PRODUCTS.filter((p) => p.quantity <= 20 && p.quantity > 0).length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border hidden sm:block">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-foreground">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-destructive">
              {MOCK_PRODUCTS.filter((p) => p.quantity === 0).length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border hidden lg:block">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-primary">
              KES {(
                MOCK_PRODUCTS.reduce((sum, p) => sum + p.price * p.quantity, 0) / 1000000
              ).toFixed(1)}M
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-10 flex-1 text-sm"
        />
        <Button variant="outline" className="gap-2 bg-transparent text-sm h-10">
          <BarChart3 className="w-4 h-4" />
          <span className="hidden sm:inline">Reports</span>
        </Button>
      </div>

      {/* Products Grid */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Products</CardTitle>
          <CardDescription>{filteredProducts.length} products available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredProducts.map((product) => {
              const inventory = MOCK_INVENTORY[product.id]
              const stockStatus = getStockStatus(product.quantity)

              return (
                <div
                  key={product.id}
                  className="p-3 sm:p-4 border border-border rounded-lg hover:bg-secondary/50 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm sm:text-base truncate">{product.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{product.description}</p>
                    </div>
                    <Badge className="bg-primary/30 text-primary text-xs w-fit">{product.category}</Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 py-3 border-y border-border mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Price</p>
                      <p className="font-semibold text-foreground text-sm">
                        KES {(product.price / 1000).toFixed(0)}K
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Stock</p>
                      <p className="font-semibold text-foreground text-sm">{product.quantity}</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-xs text-muted-foreground">Reorder</p>
                      <p className="font-semibold text-foreground text-sm">
                        {inventory?.reorderLevel || 0}
                      </p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-xs text-muted-foreground">Total Value</p>
                      <p className="font-semibold text-foreground text-sm">
                        KES {((product.price * product.quantity) / 1000).toFixed(0)}K
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <Badge className={stockStatus.color}>{stockStatus.label}</Badge>
                    {user?.role !== 'customer' && (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="text-primary h-8 px-2">
                          <Edit2 className="w-4 h-4" />
                          <span className="hidden sm:inline ml-1 text-xs">Edit</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive h-8 px-2">
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline ml-1 text-xs">Delete</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add Product Dialog */}
      {user?.role !== 'customer' && (
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add New Product</DialogTitle>
              <DialogDescription>Add a new product to your inventory</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Product Name</label>
                <Input placeholder="Enter product name" className="mt-1 h-10 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Description</label>
                <textarea
                  placeholder="Enter product description"
                  className="w-full mt-1 p-3 rounded-md border border-border bg-background text-foreground text-sm"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Product Image</label>
                <Input
                  type="file"
                  accept="image/*"
                  className="mt-1 h-10 text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">Supported formats: JPG, PNG, WebP (Max 5MB)</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Category</label>
                <select className="w-full h-10 mt-1 px-3 rounded-md border border-border bg-background text-sm">
                  <option>Craft</option>
                  <option>Beauty</option>
                  <option>Textiles</option>
                  <option>Jewelry</option>
                  <option>Homeware</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground">Price (KES)</label>
                  <Input type="number" placeholder="Price" className="mt-1 h-10 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Quantity</label>
                  <Input type="number" placeholder="Qty" className="mt-1 h-10 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Reorder Level</label>
                <Input type="number" placeholder="When to reorder" className="mt-1 h-10 text-sm" />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent text-sm"
                  onClick={() => setIsAddOpen(false)}
                >
                  Cancel
                </Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-sm">
                  Add Product
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
