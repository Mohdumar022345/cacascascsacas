import ChatInterface from "@/components/chat/ChatInterface";
import Sidebar from "@/components/Sidebar";

export default function Home() {
  return (
    <div className="flex w-full h-full bg-gray-100">
      <Sidebar />
      <ChatInterface />
    </div>
  );
}
