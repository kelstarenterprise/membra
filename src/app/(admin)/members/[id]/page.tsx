interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminMemberDetailPage({ params }: Props) {
  const { id } = await params;
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Member Details</h1>
      <p>Viewing details for member ID: {id}</p>
    </div>
  );
}
