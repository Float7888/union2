import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2 } from "lucide-react";
import { insertNewsItemSchema, type InsertNewsItem } from "@shared/schema";
import { z } from "zod";

export function NewsItemForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<InsertNewsItem>({
    title: "",
    url: "",
    source: "",
    type: "news",
    publishedAt: new Date(),
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createNewsItem = useMutation({
    mutationFn: async (data: InsertNewsItem) => {
      // Convert Date to ISO string for JSON serialization
      const payload = {
        ...data,
        publishedAt: data.publishedAt instanceof Date ? data.publishedAt.toISOString() : data.publishedAt
      };
      
      console.log('Sending news item data:', payload);
      
      const response = await fetch('/api/news-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.details ? errorData.details.map((d: any) => d.message).join(', ') : 'Failed to create news item');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news-items'] });
      toast({
        title: "Success",
        description: "News item added successfully!",
      });
      setFormData({
        title: "",
        url: "",
        source: "",
        type: "news",
        publishedAt: new Date(),
      });
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Ensure publishedAt is a proper Date object
      const dataToSubmit = {
        ...formData,
        publishedAt: formData.publishedAt instanceof Date ? formData.publishedAt : new Date(formData.publishedAt)
      };
      
      // Validate the form data
      const validatedData = insertNewsItemSchema.parse(dataToSubmit);
      createNewsItem.mutate(validatedData);
    } catch (error) {
      console.error('Form validation error:', error);
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          variant: "destructive",
        });
      }
    }
  };

  const handleInputChange = (field: keyof InsertNewsItem, value: string | Date) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Button onClick={() => setIsOpen(true)} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add News Item
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add News Item</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter news title..."
              required
            />
          </div>

          <div>
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => handleInputChange("url", e.target.value)}
              placeholder="https://..."
              required
            />
          </div>

          <div>
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              value={formData.source}
              onChange={(e) => handleInputChange("source", e.target.value)}
              placeholder="e.g., Labor Notes, SEIU, AFL-CIO"
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleInputChange("type", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="news">News Article</SelectItem>
                <SelectItem value="social">Social Media Post</SelectItem>
                <SelectItem value="report">Report/Study</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="publishedAt">Published Date</Label>
            <Input
              id="publishedAt"
              type="datetime-local"
              value={formData.publishedAt instanceof Date ? formData.publishedAt.toISOString().slice(0, 16) : new Date(formData.publishedAt).toISOString().slice(0, 16)}
              onChange={(e) => handleInputChange("publishedAt", new Date(e.target.value))}
              required
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={createNewsItem.isPending}>
              {createNewsItem.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Item
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}