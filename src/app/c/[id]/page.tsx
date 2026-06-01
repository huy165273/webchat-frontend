import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function ChatPage({ params }: { params: { id: string } }) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <ChatArea />
    </div>
  );
}
