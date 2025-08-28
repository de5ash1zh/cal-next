import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const availabilitySchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:mm format"),
  endTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:mm format"),
  eventTypeId: z.string().optional(),
});

export async function GET(request) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventTypeId = searchParams.get("eventTypeId");

    const where = {
      userId: session.user.id,
    };

    if (eventTypeId) {
      where.eventTypeId = eventTypeId;
    }

    const availability = await prisma.availability.findMany({
      where,
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json(availability);
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = availabilitySchema.parse(body);

    // Validate time range
    if (validatedData.startTime >= validatedData.endTime) {
      return NextResponse.json(
        { error: "Start time must be before end time" },
        { status: 400 }
      );
    }

    // Check for overlapping availability
    const overlappingAvailability = await prisma.availability.findFirst({
      where: {
        userId: session.user.id,
        dayOfWeek: validatedData.dayOfWeek,
        eventTypeId: validatedData.eventTypeId,
        OR: [
          {
            startTime: {
              lt: validatedData.endTime,
              gte: validatedData.startTime,
            },
          },
          {
            endTime: {
              gt: validatedData.startTime,
              lte: validatedData.endTime,
            },
          },
        ],
      },
    });

    if (overlappingAvailability) {
      return NextResponse.json(
        { error: "Time range overlaps with existing availability" },
        { status: 400 }
      );
    }

    const availability = await prisma.availability.create({
      data: {
        ...validatedData,
        userId: session.user.id,
      },
    });

    return NextResponse.json(availability, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating availability:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;
    const validatedData = availabilitySchema.partial().parse(updateData);

    if (validatedData.startTime && validatedData.endTime) {
      if (validatedData.startTime >= validatedData.endTime) {
        return NextResponse.json(
          { error: "Start time must be before end time" },
          { status: 400 }
        );
      }
    }

    const availability = await prisma.availability.update({
      where: {
        id,
        userId: session.user.id,
      },
      data: validatedData,
    });

    return NextResponse.json(availability);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating availability:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Availability ID is required" },
        { status: 400 }
      );
    }

    await prisma.availability.delete({
      where: {
        id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ message: "Availability deleted successfully" });
  } catch (error) {
    console.error("Error deleting availability:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
