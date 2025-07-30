"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  GraduationCap,
  Briefcase,
  Star,
  Calendar,
  Building,
  Download,
  Upload,
} from "lucide-react"
import { PromoterSkill, PromoterExperience, PromoterEducation, PromoterDocument } from "@/lib/types"
import { toast } from "sonner"

interface PromoterCVResumeProps {
  promoterId: string
  skills: PromoterSkill[]
  setSkills: (skills: PromoterSkill[]) => void
  experience: PromoterExperience[]
  setExperience: (experience: PromoterExperience[]) => void
  education: PromoterEducation[]
  setEducation: (education: PromoterEducation[]) => void
  documents: PromoterDocument[]
  setDocuments: (documents: PromoterDocument[]) => void
  isAdmin: boolean
}

export function PromoterCVResume({
  promoterId,
  skills,
  setSkills,
  experience,
  setExperience,
  education,
  setEducation,
  documents,
  setDocuments,
  isAdmin,
}: PromoterCVResumeProps) {
  const [activeTab, setActiveTab] = useState("skills")
  const [isSkillDialogOpen, setIsSkillDialogOpen] = useState(false)
  const [isExperienceDialogOpen, setIsExperienceDialogOpen] = useState(false)
  const [isEducationDialogOpen, setIsEducationDialogOpen] = useState(false)
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  // Skills
  const [skillForm, setSkillForm] = useState({ skill: "", level: "" })

  const handleSkillSubmit = async () => {
    try {
      const url = editingItem
        ? `/api/promoters/${promoterId}/skills`
        : `/api/promoters/${promoterId}/skills`

      const method = editingItem ? "PUT" : "POST"
      const body = editingItem ? { id: editingItem.id, ...skillForm } : skillForm

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const newSkill = await response.json()
        if (editingItem) {
          setSkills(skills.map((s) => (s.id === editingItem.id ? newSkill : s)))
        } else {
          setSkills([...skills, newSkill])
        }
        setSkillForm({ skill: "", level: "" })
        setEditingItem(null)
        setIsSkillDialogOpen(false)
        toast.success(editingItem ? "Skill updated successfully" : "Skill added successfully")
      }
    } catch (error) {
      toast.error("Failed to save skill")
    }
  }

  const handleSkillDelete = async (skillId: string) => {
    try {
      const response = await fetch(`/api/promoters/${promoterId}/skills`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: skillId }),
      })

      if (response.ok) {
        setSkills(skills.filter((s) => s.id !== skillId))
        toast.success("Skill deleted successfully")
      }
    } catch (error) {
      toast.error("Failed to delete skill")
    }
  }

  // Experience
  const [experienceForm, setExperienceForm] = useState({
    company: "",
    role: "",
    start_date: "",
    end_date: "",
    description: "",
  })

  const handleExperienceSubmit = async () => {
    try {
      const url = `/api/promoters/${promoterId}/experience`
      const method = editingItem ? "PUT" : "POST"
      const body = editingItem ? { id: editingItem.id, ...experienceForm } : experienceForm

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const newExperience = await response.json()
        if (editingItem) {
          setExperience(experience.map((e) => (e.id === editingItem.id ? newExperience : e)))
        } else {
          setExperience([...experience, newExperience])
        }
        setExperienceForm({ company: "", role: "", start_date: "", end_date: "", description: "" })
        setEditingItem(null)
        setIsExperienceDialogOpen(false)
        toast.success(
          editingItem ? "Experience updated successfully" : "Experience added successfully",
        )
      }
    } catch (error) {
      toast.error("Failed to save experience")
    }
  }

  const handleExperienceDelete = async (experienceId: string) => {
    try {
      const response = await fetch(`/api/promoters/${promoterId}/experience`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: experienceId }),
      })

      if (response.ok) {
        setExperience(experience.filter((e) => e.id !== experienceId))
        toast.success("Experience deleted successfully")
      }
    } catch (error) {
      toast.error("Failed to delete experience")
    }
  }

  // Education
  const [educationForm, setEducationForm] = useState({
    degree: "",
    institution: "",
    year: "",
  })

  const handleEducationSubmit = async () => {
    try {
      const url = `/api/promoters/${promoterId}/education`
      const method = editingItem ? "PUT" : "POST"
      const body = editingItem
        ? { id: editingItem.id, ...educationForm, year: parseInt(educationForm.year) || null }
        : { ...educationForm, year: parseInt(educationForm.year) || null }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const newEducation = await response.json()
        if (editingItem) {
          setEducation(education.map((e) => (e.id === editingItem.id ? newEducation : e)))
        } else {
          setEducation([...education, newEducation])
        }
        setEducationForm({ degree: "", institution: "", year: "" })
        setEditingItem(null)
        setIsEducationDialogOpen(false)
        toast.success(
          editingItem ? "Education updated successfully" : "Education added successfully",
        )
      }
    } catch (error) {
      toast.error("Failed to save education")
    }
  }

  const handleEducationDelete = async (educationId: string) => {
    try {
      const response = await fetch(`/api/promoters/${promoterId}/education`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: educationId }),
      })

      if (response.ok) {
        setEducation(education.filter((e) => e.id !== educationId))
        toast.success("Education deleted successfully")
      }
    } catch (error) {
      toast.error("Failed to delete education")
    }
  }

  // Documents
  const [documentForm, setDocumentForm] = useState({
    type: "",
    url: "",
    description: "",
  })

  const handleDocumentSubmit = async () => {
    try {
      const url = `/api/promoters/${promoterId}/documents`
      const method = editingItem ? "PUT" : "POST"
      const body = editingItem ? { id: editingItem.id, ...documentForm } : documentForm

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const newDocument = await response.json()
        if (editingItem) {
          setDocuments(documents.map((d) => (d.id === editingItem.id ? newDocument : d)))
        } else {
          setDocuments([...documents, newDocument])
        }
        setDocumentForm({ type: "", url: "", description: "" })
        setEditingItem(null)
        setIsDocumentDialogOpen(false)
        toast.success(editingItem ? "Document updated successfully" : "Document added successfully")
      }
    } catch (error) {
      toast.error("Failed to save document")
    }
  }

  const handleDocumentDelete = async (documentId: string) => {
    try {
      const response = await fetch(`/api/promoters/${promoterId}/documents`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: documentId }),
      })

      if (response.ok) {
        setDocuments(documents.filter((d) => d.id !== documentId))
        toast.success("Document deleted successfully")
      }
    } catch (error) {
      toast.error("Failed to delete document")
    }
  }

  const openEditDialog = (item: any, type: string) => {
    setEditingItem(item)
    switch (type) {
      case "skill":
        setSkillForm({ skill: item.skill, level: item.level || "" })
        setIsSkillDialogOpen(true)
        break
      case "experience":
        setExperienceForm({
          company: item.company,
          role: item.role,
          start_date: item.start_date || "",
          end_date: item.end_date || "",
          description: item.description || "",
        })
        setIsExperienceDialogOpen(true)
        break
      case "education":
        setEducationForm({
          degree: item.degree,
          institution: item.institution,
          year: item.year?.toString() || "",
        })
        setIsEducationDialogOpen(true)
        break
      case "document":
        setDocumentForm({
          type: item.type,
          url: item.url,
          description: item.description || "",
        })
        setIsDocumentDialogOpen(true)
        break
    }
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            CV/Resume management is restricted to administrators.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Skills</h3>
            <Dialog open={isSkillDialogOpen} onOpenChange={setIsSkillDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Skill
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingItem ? "Edit Skill" : "Add Skill"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="skill">Skill</Label>
                    <Input
                      id="skill"
                      value={skillForm.skill}
                      onChange={(e) => setSkillForm({ ...skillForm, skill: e.target.value })}
                      placeholder="e.g., JavaScript, Project Management"
                    />
                  </div>
                  <div>
                    <Label htmlFor="level">Level</Label>
                    <Select
                      value={skillForm.level}
                      onValueChange={(value) => setSkillForm({ ...skillForm, level: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsSkillDialogOpen(false)
                      setEditingItem(null)
                      setSkillForm({ skill: "", level: "" })
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSkillSubmit}>{editingItem ? "Update" : "Add"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-3">
            {skills.map((skill) => (
              <Card key={skill.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">{skill.skill}</span>
                      {skill.level && <Badge variant="secondary">{skill.level}</Badge>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(skill, "skill")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSkillDelete(skill.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {skills.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Star className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">No skills added yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Experience Tab */}
        <TabsContent value="experience" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Experience</h3>
            <Dialog open={isExperienceDialogOpen} onOpenChange={setIsExperienceDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Experience
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingItem ? "Edit Experience" : "Add Experience"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={experienceForm.company}
                        onChange={(e) =>
                          setExperienceForm({ ...experienceForm, company: e.target.value })
                        }
                        placeholder="Company name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Input
                        id="role"
                        value={experienceForm.role}
                        onChange={(e) =>
                          setExperienceForm({ ...experienceForm, role: e.target.value })
                        }
                        placeholder="Job title"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={experienceForm.start_date}
                        onChange={(e) =>
                          setExperienceForm({ ...experienceForm, start_date: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={experienceForm.end_date}
                        onChange={(e) =>
                          setExperienceForm({ ...experienceForm, end_date: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={experienceForm.description}
                      onChange={(e) =>
                        setExperienceForm({ ...experienceForm, description: e.target.value })
                      }
                      placeholder="Describe your role and achievements"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsExperienceDialogOpen(false)
                      setEditingItem(null)
                      setExperienceForm({
                        company: "",
                        role: "",
                        start_date: "",
                        end_date: "",
                        description: "",
                      })
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleExperienceSubmit}>{editingItem ? "Update" : "Add"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {experience.map((exp) => (
              <Card key={exp.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <Building className="h-4 w-4 text-blue-500" />
                        <h4 className="font-semibold">{exp.role}</h4>
                      </div>
                      <p className="mb-2 text-muted-foreground">{exp.company}</p>
                      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {exp.start_date && new Date(exp.start_date).toLocaleDateString()}
                          {exp.end_date && ` - ${new Date(exp.end_date).toLocaleDateString()}`}
                          {!exp.end_date && " - Present"}
                        </span>
                      </div>
                      {exp.description && <p className="text-sm">{exp.description}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(exp, "experience")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExperienceDelete(exp.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {experience.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Briefcase className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">No experience added yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Education Tab */}
        <TabsContent value="education" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Education</h3>
            <Dialog open={isEducationDialogOpen} onOpenChange={setIsEducationDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Education
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingItem ? "Edit Education" : "Add Education"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="degree">Degree</Label>
                    <Input
                      id="degree"
                      value={educationForm.degree}
                      onChange={(e) =>
                        setEducationForm({ ...educationForm, degree: e.target.value })
                      }
                      placeholder="e.g., Bachelor of Science"
                    />
                  </div>
                  <div>
                    <Label htmlFor="institution">Institution</Label>
                    <Input
                      id="institution"
                      value={educationForm.institution}
                      onChange={(e) =>
                        setEducationForm({ ...educationForm, institution: e.target.value })
                      }
                      placeholder="University or institution name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      value={educationForm.year}
                      onChange={(e) => setEducationForm({ ...educationForm, year: e.target.value })}
                      placeholder="e.g., 2020"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEducationDialogOpen(false)
                      setEditingItem(null)
                      setEducationForm({ degree: "", institution: "", year: "" })
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleEducationSubmit}>{editingItem ? "Update" : "Add"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-3">
            {education.map((edu) => (
              <Card key={edu.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="font-medium">{edu.degree}</p>
                        <p className="text-sm text-muted-foreground">{edu.institution}</p>
                        {edu.year && <p className="text-xs text-muted-foreground">{edu.year}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(edu, "education")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEducationDelete(edu.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {education.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <GraduationCap className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">No education added yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Documents</h3>
            <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingItem ? "Edit Document" : "Add Document"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="doc-type">Document Type</Label>
                    <Select
                      value={documentForm.type}
                      onValueChange={(value) => setDocumentForm({ ...documentForm, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CV">CV/Resume</SelectItem>
                        <SelectItem value="Certificate">Certificate</SelectItem>
                        <SelectItem value="ID">ID Document</SelectItem>
                        <SelectItem value="Passport">Passport</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="doc-url">Document URL</Label>
                    <Input
                      id="doc-url"
                      value={documentForm.url}
                      onChange={(e) => setDocumentForm({ ...documentForm, url: e.target.value })}
                      placeholder="https://example.com/document.pdf"
                    />
                  </div>
                  <div>
                    <Label htmlFor="doc-description">Description</Label>
                    <Textarea
                      id="doc-description"
                      value={documentForm.description}
                      onChange={(e) =>
                        setDocumentForm({ ...documentForm, description: e.target.value })
                      }
                      placeholder="Document description"
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDocumentDialogOpen(false)
                      setEditingItem(null)
                      setDocumentForm({ type: "", url: "", description: "" })
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleDocumentSubmit}>{editingItem ? "Update" : "Add"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-3">
            {documents.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="font-medium">{doc.type}</p>
                        {doc.description && (
                          <p className="text-sm text-muted-foreground">{doc.description}</p>
                        )}
                        {doc.uploaded_on && (
                          <p className="text-xs text-muted-foreground">
                            Uploaded: {new Date(doc.uploaded_on).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(doc.url, "_blank")}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(doc, "document")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDocumentDelete(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {documents.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">No documents added yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
