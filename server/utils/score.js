export const calculateTotalScore = async (ratings) => {
      if (!ratings) return 0;

      try{

      const {
            communication,
            subject,
            personality,
            presentation,
            overallRemark
              } = ratings;

            const communicationScore = communication?.score || 0;   
            const subjectScore = subject?.depthRating || 0;
            const personalityScore = personality?.score || 0;
            const presentationScore = presentation?.score || 0;
             
          
              const remarkScore = overallRemark?.tag === "Excellent" ? 5 :    
                      overallRemark?.tag === "Good" ? 4 :
                      overallRemark?.tag === "Okay" ? 3 : 1;

                return (
                      communicationScore +
                      subjectScore +
                      personalityScore +
                      presentationScore +
                      remarkScore
                    );
 }
 catch (error) {
     console.error("calculateTotalScore error:", error);
     return 0;
 }

}