import { useState, useEffect, useRef } from "react"
import { getSupabaseClient } from "../lib/supabase"
import { useUserRole } from "../hooks/useUserRole"
import { PartyNote, PartyTag, PartyActivity, PartyFile } from "../lib/types"
import { User } from "@supabase/supabase-js"

interface PartyDetailProps {
  partyId: number
}

export default function PartyDetail({ partyId }: PartyDetailProps) {
  const [user, setUser] = useState<User | null>(null)
  const [notes, setNotes] = useState<PartyNote[]>([])
  const [tags, setTags] = useState<PartyTag[]>([])
  const [activities, setActivities] = useState<PartyActivity[]>([])
  const [files, setFiles] = useState<PartyFile[]>([])
  const [noteInput, setNoteInput] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [ownerId, setOwnerId] = useState<string | null>(null)
  const [users, setUsers] = useState<{ id: string; full_name: string | null }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const role = useUserRole()

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const supabase = getSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    // Listen for auth changes
    const supabase = getSupabaseClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      const partyIdStr = partyId.toString()
      // Fetch notes, tags, activities, and party owner
      const supabase = getSupabaseClient()
      supabase
        .from("party_notes")
        .select("*")
        .eq("party_id", partyIdStr)
        .then(({ data }) => setNotes((data as unknown as PartyNote[]) || []))
      supabase
        .from("party_tags")
        .select("*")
        .eq("party_id", partyIdStr)
        .then(({ data }) => setTags((data as unknown as PartyTag[]) || []))
      supabase
        .from("party_activities")
        .select("*")
        .eq("party_id", partyIdStr)
        .then(({ data }) => setActivities((data as unknown as PartyActivity[]) || []))
      supabase
        .from("parties")
        .select("owner_id")
        .eq("id", partyIdStr)
        .single()
        .then(({ data }) => setOwnerId(data?.owner_id || null))
      supabase
        .from("profiles")
        .select("id, full_name")
        .then(({ data }) =>
          setUsers((data || []).map((u) => ({ id: u.id, full_name: u.full_name ?? null }))),
        )
      supabase
        .from("party_files")
        .select("*")
        .eq("party_id", partyIdStr)
        .then(({ data }) => setFiles((data as unknown as PartyFile[]) || []))
    }
  }, [user, partyId])

  const addNote = async () => {
    if (!noteInput.trim() || !user) return
    const supabase = getSupabaseClient()
    await supabase
      .from("party_notes")
      .insert({ party_id: partyId.toString(), user_id: user.id, note: noteInput })
    setNoteInput("")
    supabase
      .from("party_notes")
      .select("*")
      .eq("party_id", partyId.toString())
      .then(({ data }) => setNotes((data as unknown as PartyNote[]) || []))
  }

  const addTag = async () => {
    if (!tagInput.trim()) return
    const supabase = getSupabaseClient()
    await supabase.from("party_tags").insert({ party_id: partyId.toString(), tag: tagInput })
    setTagInput("")
    supabase
      .from("party_tags")
      .select("*")
      .eq("party_id", partyId.toString())
      .then(({ data }) => setTags((data as unknown as PartyTag[]) || []))
  }

  const changeOwner = async (newOwnerId: string) => {
    const supabase = getSupabaseClient()
    await supabase.from("parties").update({ owner_id: newOwnerId }).eq("id", partyId.toString())
    setOwnerId(newOwnerId)
  }

  const uploadFile = async (file: File) => {
    if (!user) return
    const filePath = `${partyId}/${Date.now()}_${file.name}`
    const supabase = getSupabaseClient()
    const { error } = await supabase.storage.from("party-files").upload(filePath, file)
    if (error) {
      console.error("Error uploading file:", error)
      return
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("party-files").getPublicUrl(filePath)
    await supabase.from("party_files").insert({
      party_id: partyId.toString(),
      file_name: file.name,
      file_path: filePath,
      file_url: publicUrl,
      uploaded_by: user.id,
    })
    supabase
      .from("party_files")
      .select("*")
      .eq("party_id", partyId.toString())
      .then(({ data }) => setFiles((data as unknown as PartyFile[]) || []))
  }

  const deleteFile = async (file: PartyFile) => {
    const supabase = getSupabaseClient()
    const filePath = file.file_url.split("/party-files/")[1]
    await supabase.storage.from("party-files").remove([filePath])
    await supabase.from("party_files").delete().eq("id", parseInt(file.id))
    supabase
      .from("party_files")
      .select("*")
      .eq("party_id", partyId.toString())
      .then(({ data }) => setFiles((data as unknown as PartyFile[]) || []))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      uploadFile(file)
    }
  }

  if (!user) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      {/* Notes Section */}
      <div className="rounded-lg bg-white p-4 shadow">
        <h3 className="mb-4 text-lg font-semibold">Notes</h3>
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="Add a note..."
            className="flex-1 rounded border p-2"
          />
          <button onClick={addNote} className="rounded bg-blue-500 px-4 py-2 text-white">
            Add
          </button>
        </div>
        <div className="space-y-2">
          {notes.map((note) => (
            <div key={note.id} className="rounded bg-gray-50 p-2">
              <p className="text-sm text-gray-600">{note.note}</p>
              <p className="text-xs text-gray-400">
                {new Date(note.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tags Section */}
      <div className="rounded-lg bg-white p-4 shadow">
        <h3 className="mb-4 text-lg font-semibold">Tags</h3>
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add a tag..."
            className="flex-1 rounded border p-2"
          />
          <button onClick={addTag} className="rounded bg-green-500 px-4 py-2 text-white">
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag.id} className="rounded bg-green-100 px-2 py-1 text-sm text-green-800">
              {tag.tag}
            </span>
          ))}
        </div>
      </div>

      {/* Owner Section */}
      {role === "admin" && (
        <div className="rounded-lg bg-white p-4 shadow">
          <h3 className="mb-4 text-lg font-semibold">Change Owner</h3>
          <select
            value={ownerId || ""}
            onChange={(e) => changeOwner(e.target.value)}
            className="rounded border p-2"
          >
            <option value="">Select owner...</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name || user.id}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Files Section */}
      <div className="rounded-lg bg-white p-4 shadow">
        <h3 className="mb-4 text-lg font-semibold">Files</h3>
        <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="mb-4 rounded bg-purple-500 px-4 py-2 text-white"
        >
          Upload File
        </button>
        <div className="space-y-2">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between rounded bg-gray-50 p-2">
              <a
                href={file.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {file.file_name}
              </a>
              <button
                onClick={() => deleteFile(file)}
                className="rounded bg-red-500 px-2 py-1 text-sm text-white"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
