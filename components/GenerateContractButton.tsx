import { useState } from "react"
import { useGenerateContract } from "@/hooks/use-generate-contract"

const CONTRACT_TYPES = [
  { value: "", label: "Select contract type" },
  { value: "employment", label: "Employment" },
  { value: "consulting", label: "Consulting" },
  { value: "nda", label: "NDA" },
]

export default function GenerateContractButton() {
  const { generateContract, loading, pdfUrl, error } = useGenerateContract()
  const [form, setForm] = useState({
    contractId: "",
    contractNumber: "",
    first_party_id: "",
    second_party_id: "",
    promoter_id: "",
    contract_start_date: "",
    contract_end_date: "",
    email: "",
    job_title: "",
    work_location: "",
    department: "",
    contract_type: "",
    currency: "",
  })
  const [formError, setFormError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!form.contract_type) {
      setFormError("Please select a contract type.")
      return
    }
    try {
      await generateContract(form)
    } catch {}
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: 400,
        margin: "2rem auto",
        padding: 16,
        border: "1px solid #eee",
        borderRadius: 8,
      }}
    >
      <h3>Generate Contract PDF</h3>
      {Object.keys(form).map((key) =>
        key === "contract_type" ? (
          <div key={key} style={{ marginBottom: 8 }}>
            <label style={{ display: "block", fontWeight: 500 }}>
              Contract Type
              <select
                name="contract_type"
                value={form.contract_type}
                onChange={handleChange}
                style={{ width: "100%", padding: 4, marginTop: 2 }}
                required
              >
                {CONTRACT_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : (
          <div key={key} style={{ marginBottom: 8 }}>
            <label style={{ display: "block", fontWeight: 500 }}>
              {key.replace(/_/g, " ")}
              <input
                type="text"
                name={key}
                value={form[key as keyof typeof form]}
                onChange={handleChange}
                style={{ width: "100%", padding: 4, marginTop: 2 }}
                required={["contractId", "contractNumber"].includes(key)}
              />
            </label>
          </div>
        ),
      )}
      <button
        type="submit"
        disabled={loading}
        style={{ width: "100%", padding: 8, fontWeight: 600 }}
      >
        {loading ? "Generating..." : "Generate PDF"}
      </button>
      {formError && <div style={{ color: "red", marginTop: 8 }}>{formError}</div>}
      {pdfUrl && (
        <div style={{ marginTop: 16 }}>
          <strong>PDF URL:</strong>{" "}
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
            {pdfUrl}
          </a>
        </div>
      )}
      {error && <div style={{ color: "red", marginTop: 8 }}>Error: {error}</div>}
    </form>
  )
}
