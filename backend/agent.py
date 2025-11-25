from dotenv import load_dotenv
from prompts import AGENT_INSTRUCTION, SESSION_INSTRUCTION
from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions
from livekit.agents.voice.room_io import TextInputEvent
from livekit.plugins import (
    openai,
    noise_cancellation,
    google,
)
from mcp_client import MCPServerSse
from mcp_client.agent_tools import MCPToolsIntegration
import os
import logging
import sys
from tools import open_url

load_dotenv()

# Set up logging
logger = logging.getLogger(__name__)


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions=AGENT_INSTRUCTION,
            tools=[open_url],
        )


async def entrypoint(ctx: agents.JobContext):
    # CRITICAL: Connect to the room FIRST
    await ctx.connect()
    
    # Initialize the agent session
    session = AgentSession(
        llm=google.beta.realtime.RealtimeModel(
            voice="Charon",
            temperature=0.6,
        ),
    )

    # Set up MCP server
    mcp_server = MCPServerSse(
        params={"url": os.environ.get("N8N_MCP_SERVER_URL")},
        cache_tools_list=True,
        name="SSE MCP Server"
    )

    # Create agent with MCP tools
    agent = await MCPToolsIntegration.create_agent_with_tools(
        agent_class=Assistant,
        mcp_servers=[mcp_server]
    )

    # Custom text input handler for processing text messages on 'lk.chat' topic
    # This is how LiveKit playground handles text messages during calls
    # The callback receives (session, event) as arguments
    # TextInputEvent is a dataclass with: text (str), info (rtc.TextStreamInfo), participant (rtc.RemoteParticipant)
    async def handle_text_input(session: AgentSession, event: TextInputEvent) -> None:
        """Handle incoming text messages from participants"""
        try:
            # Access text from the event (TextInputEvent is a dataclass)
            text = event.text.strip()
            if not text:
                logger.debug("Received empty text message, ignoring")
                return
            
            # Get participant identity
            participant_identity = event.participant.identity if event.participant else 'unknown'
            
            # Get topic from info object (TextStreamInfo has a topic attribute)
            topic = event.info.topic if event.info else None
            
            logger.info(f"Received text message from {participant_identity} on topic '{topic}': {text}")
            
            # Process messages from 'lk.chat' topic (LiveKit standard for chat)
            # Also accept messages without topic for flexibility
            if topic == 'lk.chat' or topic is None:
                logger.info(f"Processing text message: {text}")
                # Interrupt any current speech to respond to the text message
                session.interrupt()
                # Generate a reply to the text message
                await session.generate_reply(
                    user_input=text,
                    instructions=SESSION_INSTRUCTION,
                )
            else:
                logger.debug(f"Ignoring text message on topic '{topic}' (not 'lk.chat')")
        except Exception as e:
            logger.error(f"Error handling text input: {e}", exc_info=True)

    # Start the session AFTER connecting
    await session.start(
        room=ctx.room,
        agent=agent,
        room_input_options=RoomInputOptions(
            # Enable text input for chat messages
            text_enabled=True,
            # Enable video for the agent
            video_enabled=True,
            # Enable audio for the agent
            audio_enabled=True,
            # LiveKit Cloud enhanced noise cancellation
            # - If self-hosting, omit this parameter
            # - For telephony applications, use `BVCTelephony` for best results
            noise_cancellation=noise_cancellation.BVC(),
            # Custom text input handler for processing chat messages
            text_input_cb=handle_text_input,
        ),
    )

    # Generate the initial greeting
    await session.generate_reply(
        instructions=SESSION_INSTRUCTION,
    )


if __name__ == "__main__":
    # Detect if we're just downloading files during container build
    skip_env_validation = len(sys.argv) > 1 and sys.argv[1] == "download-files"

    # Get environment variables (may be missing during download-files)
    livekit_url = os.getenv("LIVEKIT_URL")
    livekit_api_key = os.getenv("LIVEKIT_API_KEY")
    livekit_api_secret = os.getenv("LIVEKIT_API_SECRET")

    print("=" * 60)
    print("Agent Worker Configuration:")
    print("=" * 60)
    print(f"LIVEKIT_URL: {livekit_url}")
    print(f"LIVEKIT_API_KEY: {'SET' if livekit_api_key else 'NOT SET'}")
    print(f"LIVEKIT_API_SECRET: {'SET' if livekit_api_secret else 'NOT SET'}")
    print("=" * 60)

    if skip_env_validation:
        print("download-files detected; skipping LiveKit environment validation.")
        # Provide placeholder values so the CLI can run download-files without connecting
        livekit_url = livekit_url or "wss://placeholder.livekit.invalid"
        livekit_api_key = livekit_api_key or "placeholder_key"
        livekit_api_secret = livekit_api_secret or "placeholder_secret"
    else:
        if not livekit_url or livekit_url == "wss://your-livekit-server.com":
            print("ERROR: LIVEKIT_URL is not properly configured!")
            print("Please set LIVEKIT_URL in your .env file.")
            exit(1)

        if not livekit_api_key or not livekit_api_secret:
            print("ERROR: LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set!")
            print("Please set these in your .env file.")
            exit(1)
    
    # WorkerOptions defaults to ws://localhost:7880, so we need to explicitly pass ws_url
    # Convert wss:// to ws:// for the worker connection (worker uses ws://, not wss://)
    # Actually, the worker should use the same protocol as the URL
    worker_url = livekit_url
    
    print(f"\nStarting agent worker...")
    print(f"Worker will connect to: {worker_url}")
    print("Waiting for job assignments from LiveKit server...\n")
    
    # Explicitly configure WorkerOptions with the URL and credentials
    worker_options = agents.WorkerOptions(
        entrypoint_fnc=entrypoint,
        ws_url=worker_url,
        api_key=livekit_api_key,
        api_secret=livekit_api_secret,
    )
    
    agents.cli.run_app(worker_options)