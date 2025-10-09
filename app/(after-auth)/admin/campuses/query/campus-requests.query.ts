import { prisma } from "@/prisma/prisma-client";

export const getCampusRequests = async (status: "PENDING" | "APPROVED" | "REJECTED" | "ALL" = "PENDING") => {
  try {
    const whereClause = status === "ALL" ? {} : { status };

    const requests = await prisma.campusRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            email: true,
            name: true,
            studentName: true,
            parentName: true,
            parentPhone: true,
          },
        },
        campus: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        requestedAt: "desc",
      },
    });

    return requests;
  } catch (error) {
    console.error("Error fetching campus requests:", error);
    throw error;
  }
};

export const getPendingCampusRequestsCount = async () => {
  try {
    const count = await prisma.campusRequest.count({
      where: {
        status: "PENDING",
      },
    });

    return count;
  } catch (error) {
    console.error("Error fetching pending campus requests count:", error);
    return 0;
  }
};
